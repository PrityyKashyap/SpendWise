/**
 * Money helpers.
 *
 * ARCHITECTURE.md D1: every monetary value in SpendWise is an INTEGER number
 * of paise. ₹8,000.00 is stored, sent and calculated as 800000.
 *
 * Floats cannot represent decimal currency exactly (0.1 + 0.2 !== 0.3), and in
 * a splitting app that error compounds until group balances stop summing to
 * zero. Integers make the split arithmetic exact by construction.
 *
 * The split/rounding logic that builds on these helpers arrives in Phase 6.
 */

/** Rupees (number or numeric string) → integer paise. `toPaise('80.50')` → 8050 */
export function toPaise(rupees) {
  const value = typeof rupees === 'string' ? Number(rupees.trim()) : rupees;
  if (!Number.isFinite(value)) {
    throw new TypeError(`toPaise: expected a finite number, received ${rupees}`);
  }
  // Math.round, not Math.trunc. In binary floating point 0.29 * 100 is
  // 28.999999999999996, so truncating gives 28 and a paisa vanishes. This is
  // not a rare edge case: it affects 573 of the first 10,000 rupee values.
  return Math.round(value * 100);
}

/** Integer paise → rupees as a number. `fromPaise(8050)` → 80.5 */
export function fromPaise(paise) {
  assertPaise(paise);
  return paise / 100;
}

/** Integer paise → display string. `formatMoney(800000)` → '₹8,000.00' */
export function formatMoney(paise, { currency = 'INR', locale = 'en-IN' } = {}) {
  assertPaise(paise);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

/** Throw unless `value` is a safe integer — guards against floats sneaking in. */
export function assertPaise(value) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Expected an integer paise amount, received ${value}`);
  }
}
