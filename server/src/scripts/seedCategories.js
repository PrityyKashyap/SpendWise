/**
 * Seed the system default categories.
 *
 * Run once with `npm run seed`. These are shared rows with `userId: null`
 * visible to every user (ARCHITECTURE.md §2.2), not per-account copies.
 *
 * Idempotent: re-running updates the icon and colour of existing defaults and
 * inserts anything missing, so it is safe to run after adding a category to
 * shared/constants.js.
 */
import mongoose from 'mongoose';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@spendwise/shared/constants.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { logger } from '../utils/logger.js';

async function seed() {
  await connectDB();

  const rows = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: 'expense' })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: 'income' })),
  ];

  // One bulk round-trip instead of N queries. upsert keeps this idempotent.
  const result = await Category.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { userId: null, name: row.name, type: row.type },
        update: { $set: { ...row, userId: null, isDefault: true } },
        upsert: true,
      },
    }))
  );

  logger.info(
    `Categories seeded — ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ` +
      `${rows.length} total defaults.`
  );

  await disconnectDB();
}

seed().catch(async (err) => {
  logger.error('Seeding failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
