export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
