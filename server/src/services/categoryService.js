/**
 * Category business logic.
 */
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * List the categories a user can choose from: the system defaults plus their
 * own custom ones.
 */
export async function listCategories(userId, { type } = {}) {
  const filter = { userId: { $in: [null, userId] } };
  if (type) filter.type = type;

  // Defaults first, then custom, each alphabetical — a stable order so the
  // dropdown does not reshuffle between loads.
  return Category.find(filter).sort({ isDefault: -1, name: 1 }).lean();
}

/** Create a custom category owned by this user. */
export async function createCategory(userId, data) {
  // A user may add "Groceries" even though a default "Food" exists, but not a
  // second "Groceries" of the same type. Checked here for a friendly message;
  // the unique index is the real guarantee against a race.
  const clash = await Category.findOne({ userId, type: data.type, name: data.name });
  if (clash) {
    throw new ApiError(409, 'DUPLICATE_KEY', `You already have a "${data.name}" category.`, {
      name: 'Already exists',
    });
  }

  const category = await Category.create({ ...data, userId, isDefault: false });
  return category.toObject();
}

/**
 * Load a category the user is allowed to modify.
 *
 * Ownership is part of the filter, not a follow-up check: a category belonging
 * to someone else simply is not found (ARCHITECTURE.md §5.6).
 */
async function findOwned(userId, categoryId) {
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) {
    // 404 rather than 403 — a 403 would confirm the row exists.
    throw new ApiError(404, 'NOT_FOUND', 'Category not found.');
  }
  return category;
}

export async function updateCategory(userId, categoryId, data) {
  const category = await findOwned(userId, categoryId);
  Object.assign(category, data);
  await category.save();
  return category.toObject();
}

/**
 * Delete a custom category.
 *
 * Refused while transactions still reference it: deleting would leave those
 * rows pointing at nothing, and their category would silently disappear from
 * every chart and list (ARCHITECTURE.md appendix #10).
 */
export async function deleteCategory(userId, categoryId) {
  const category = await findOwned(userId, categoryId);

  const inUse = await Transaction.countDocuments({ userId, categoryId });
  if (inUse > 0) {
    throw new ApiError(
      409,
      'CATEGORY_IN_USE',
      `"${category.name}" is used by ${inUse} transaction${inUse === 1 ? '' : 's'}. ` +
        `Recategorise them first.`
    );
  }

  await category.deleteOne();
}

/**
 * Confirm a category id is usable by this user for a given type.
 *
 * Called before saving a transaction so a user cannot attach someone else's
 * category, or file income under an expense category.
 */
export async function assertUsableCategory(userId, categoryId, type) {
  const category = await Category.findOne({
    _id: categoryId,
    userId: { $in: [null, userId] },
  }).lean();

  if (!category) {
    throw new ApiError(422, 'INVALID_CATEGORY', 'That category does not exist.', {
      categoryId: 'Choose a category',
    });
  }

  if (type && category.type !== type) {
    throw new ApiError(
      422,
      'INVALID_CATEGORY',
      // "an expense" / "a income" both read wrong; pick the article.
      `"${category.name}" is ${category.type === 'expense' ? 'an' : 'a'} ${category.type} category.`,
      { categoryId: `Choose a ${type} category` }
    );
  }

  return category;
}
