// Utility to extract tags from FITS header metadata
// Example fields: OBJECT, TELESCOP, FILTER, DATE-OBS, INSTRUME, NGC, M, etc.

<<<<<<< HEAD
export function extractTagsFromFitsHeader(header: Record<string, any>): string[] {
=======
export function extractTagsFromFitsHeader(header: Record<string, unknown>): string[] {
>>>>>>> calibration
  const tags: string[] = [];
  if (!header) return tags;

  // Object name (NGC, Messier, or custom)
  if (header.OBJECT) tags.push(header.OBJECT);
  if (header.NGC) tags.push(`NGC ${header.NGC}`);
  if (header.M) tags.push(`M ${header.M}`);

  // Telescope
  if (header.TELESCOP) tags.push(header.TELESCOP);
  if (header.INSTRUME) tags.push(header.INSTRUME);

  // Filter
  if (header.FILTER) tags.push(header.FILTER);

  // Date (just year or YYYY-MM-DD)
  if (header['DATE-OBS']) {
    const date = header['DATE-OBS'];
    if (typeof date === 'string' && date.length >= 4) {
      tags.push(date.slice(0, 10));
    }
  }

  // Add any other relevant fields as tags
  // e.g., EXPTIME, OBSERVER, SITE, etc.
  if (header.EXPTIME) tags.push(`Exp: ${header.EXPTIME}s`);
  if (header.OBSERVER) tags.push(header.OBSERVER);
  if (header.SITE) tags.push(header.SITE);

  // Remove duplicates and falsy values
  return Array.from(new Set(tags.filter(Boolean)));
} 