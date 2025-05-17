import fetch from 'node-fetch';

/**
 * Query SIMBAD Sesame for astronomical object info by name.
 * Returns { ra, dec, type, mainId, raw } or null if not found.
 */
export async function simbadLookup(objectName: string) {
  if (!objectName) return null;
  // SIMBAD Sesame service: http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame
  const url = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/${encodeURIComponent(objectName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('SIMBAD lookup failed');
    const text = await res.text();
    // Parse coordinates (in J2000, degrees)
    // Example line: <jpos>83.82208 -5.39111</jpos>
    const raMatch = text.match(/<jpos>([\d.+-]+) ([\d.+-]+)<\/jpos>/);
    const typeMatch = text.match(/<otype>([^<]+)<\/otype>/);
    const mainIdMatch = text.match(/<oname>([^<]+)<\/oname>/);
    if (!raMatch) return null;
    return {
      ra: parseFloat(raMatch[1]),
      dec: parseFloat(raMatch[2]),
      type: typeMatch ? typeMatch[1] : undefined,
      mainId: mainIdMatch ? mainIdMatch[1] : undefined,
      raw: text,
    };
  } catch (err) {
    console.error('[SIMBAD] Lookup error:', err);
    return null;
  }
} 