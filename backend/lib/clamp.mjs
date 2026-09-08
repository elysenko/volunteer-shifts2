/**
 * Clamps a number within an inclusive [lo, hi] range.
 *
 * @param {number} n  - The value to clamp.
 * @param {number} lo - The lower bound (inclusive).
 * @param {number} hi - The upper bound (inclusive).
 * @returns {number} The clamped value: lo <= result <= hi.
 */
export function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
