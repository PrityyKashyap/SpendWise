/**
 * Transaction business logic (ARCHITECTURE.md §3.4).
 *
 * Every query filters on userId. Ownership is part of the filter rather than a
 * check afterwards, so forgetting it produces an obvious bug in development
 * instead of a silent data leak in production (§5.6, IDEA.md §32.19).
 */
import { Transaction } from '../models/Transaction.js';
import { ApiError } from '../utils/ApiError.js';
import { parseCalendarDate, calendarRange } from '../utils/date.js';
import { assertUsableCategory } from './categoryService.js';

/** Fields returned to the client, with the category resolved for display. */
const POPULATE_CATEGORY = { path: 'categoryId', select: 'name icon color type' };

/** Reshape a document so the client gets `category` rather than `categoryId`. */
function present(doc) {
  const { categoryId, ...rest } = doc;
  return { ...rest, category: categoryId, source: 'personal' };
}

/** Build the Mongo filter for a list query. */
function buildFilter(userId, query) {
  const filter = { userId };

  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

  const dateRange = calendarRange(query);
  if (dateRange) filter.date = dateRange;

  if (query.minAmount != null || query.maxAmount != null) {
    filter.amount = {};
    if (query.minAmount != null) filter.amount.$gte = query.minAmount;
    if (query.maxAmount != null) filter.amount.$lte = query.maxAmount;
  }

  if (query.search) {
    // Regex rather than $text: it matches partial words ("din" finds "Dinner"),
    // which is what a search-as-you-type box needs. escapeRegex keeps a user's
    // "(" or "*" from throwing a regex error.
    filter.description = { $regex: escapeRegex(query.search), $options: 'i' };
  }

  return filter;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Translate a sort key like '-date' into a Mongo sort object. */
function buildSort(sort) {
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  // _id breaks ties so pagination is stable — without it, rows sharing a date
  // can reappear on page 2 or be skipped entirely.
  return { [field]: descending ? -1 : 1, _id: -1 };
}

/** Paginated, filtered list. */
export async function listTransactions(userId, query) {
  const filter = buildFilter(userId, query);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort(buildSort(query.sort))
      .skip(skip)
      .limit(query.limit)
      .populate(POPULATE_CATEGORY)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    items: items.map(present),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTransaction(userId, id) {
  const transaction = await Transaction.findOne({ _id: id, userId })
    .populate(POPULATE_CATEGORY)
    .lean();

  if (!transaction) throw new ApiError(404, 'NOT_FOUND', 'Transaction not found.');
  return present(transaction);
}

export async function createTransaction(userId, data) {
  // The category must exist, be usable by this user, and match the type.
  await assertUsableCategory(userId, data.categoryId, data.type);

  const created = await Transaction.create({
    ...data,
    userId,
    date: parseCalendarDate(data.date), // 'YYYY-MM-DD' → UTC midnight
  });

  return getTransaction(userId, created._id);
}

export async function updateTransaction(userId, id, data) {
  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) throw new ApiError(404, 'NOT_FOUND', 'Transaction not found.');

  // Re-validate the category against the type this transaction will END UP
  // with — changing type alone must not leave a mismatched category behind.
  if (data.categoryId || data.type) {
    const nextType = data.type ?? transaction.type;
    const nextCategory = data.categoryId ?? transaction.categoryId;
    await assertUsableCategory(userId, nextCategory, nextType);
  }

  Object.assign(transaction, data);
  if (data.date) transaction.date = parseCalendarDate(data.date);

  await transaction.save();
  return getTransaction(userId, transaction._id);
}

export async function deleteTransaction(userId, id) {
  const result = await Transaction.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'NOT_FOUND', 'Transaction not found.');
  }
}
