// Utility to extract tags from FITS header metadata
// Example fields: OBJECT, TELESCOP, FILTER, DATE-OBS, INSTRUME, NGC, M, etc.

export function extractTagsFromFitsHeader(header: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (!header) return tags;

  // Object name (NGC, Messier, or custom)
  if (typeof header.OBJECT === 'string') tags.push(header.OBJECT);
  if (typeof header.NGC === 'string') tags.push(`NGC ${header.NGC}`);
  if (typeof header.M === 'string') tags.push(`M ${header.M}`);

  // Telescope
  if (typeof header.TELESCOP === 'string') tags.push(header.TELESCOP);
  if (typeof header.INSTRUME === 'string') tags.push(header.INSTRUME);

  // Filter
  if (typeof header.FILTER === 'string') tags.push(header.FILTER);

  // Date (just year or YYYY-MM-DD)
  if (typeof header['DATE-OBS'] === 'string') {
    const date = header['DATE-OBS'];
    if (date.length >= 4) {
      tags.push(date.slice(0, 10));
    }
  }

  // Add any other relevant fields as tags
  // e.g., EXPTIME, OBSERVER, SITE, etc.
  if (typeof header.EXPTIME === 'string' || typeof header.EXPTIME === 'number') tags.push(`Exp: ${header.EXPTIME}s`);
  if (typeof header.OBSERVER === 'string') tags.push(header.OBSERVER);
  if (typeof header.SITE === 'string') tags.push(header.SITE);

  // Remove duplicates and falsy values
  return Array.from(new Set(tags.filter(Boolean)));
} 