/**
 * Converts arbitrary text into a URL-safe slug.
 *
 * Non-ASCII characters (e.g. accented letters) are stripped rather than
 * transliterated so that the output is deterministic across all platforms
 * without requiring a unicode data table — transliteration would silently
 * change 'Café au Lait' to 'cafe-au-lait' instead of the pinned 'caf-au-lait'.
 *
 * Transformation chain (order is load-bearing):
 *   1. Lowercase + trim surrounding whitespace.
 *   2. Strip every non-ASCII character (U+0080 and above).
 *   3. Collapse each run of non-alphanumeric ASCII chars into a single hyphen.
 *   4. Remove any leading or trailing hyphens.
 *
 * @param {string} text - The text to slugify.
 * @returns {string} A lowercase, hyphen-separated slug, or '' for blank input.
 */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
