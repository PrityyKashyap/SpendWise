/**
 * Money helpers — the client mirror of server/src/utils/money.js.
 *
 * ARCHITECTURE.md D1: amounts cross the network as INTEGER paise. The API
 * sends 800000; the UI shows ₹8,000.00. Conversion happens at exactly two
 * boundaries — the form (rupees in → paise out) and display (paise → string).
 * Nothing in between ever handles a fractional rupee.
 */

/** Rupees (number or string from an input) → integer paise. */
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

/** Integer paise → rupees as a number, for populating form inputs. */
export function fromPaise(paise) {
  return paise / 100;
}

/** Integer paise → display string. `formatMoney(800000)` → '₹8,000.00' */
export function formatMoney(paise, { currency = 'INR', locale = 'en-IN' } = {}) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format((paise ?? 0) / 100);
}
