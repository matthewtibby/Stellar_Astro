// ESA Sky image fetch utility for project thumbnails
// Uses ESA Sky Image Cutout Service: https://sky.esa.int/esasky-cutout

export async function getEsaSkyImageUrl(target: { id?: string; name?: string; catalogIds?: string[]; commonNames?: string[]; coordinates?: { ra?: string; dec?: string }, angularSize?: { major?: number; minor?: number } }): Promise<string> {
  // Prefer coordinates if available
  let fov = 0.6; // default FOV in degrees
  if (target?.angularSize?.major) {
    // major is in arcminutes, convert to degrees, add margin
    const margin = 1.5; // show more context
    fov = Math.max(0.1, (Number(target.angularSize.major) || 0) * margin / 60);
  }
  if (target?.coordinates && target.coordinates.ra != null && target.coordinates.dec != null) {
    const ra = target.coordinates.ra;
    const dec = target.coordinates.dec;
    // Use NASA SkyView cutout service with DSS2 Red survey, dynamic FOV
    return `https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${ra},${dec}&Survey=DSS2%20Red&pixels=400&size=${fov}&Return=PNG`;
  }
  // Otherwise, try name, id, catalogIds, commonNames in order
  const queries = [target?.name, target?.id, ...(target?.catalogIds || []), ...(target?.commonNames || [])].filter(Boolean);
  for (const query of queries) {
    if (!query) continue;
    // Use ESA Sky cutout with dynamic FOV
    const url = `https://sky.esa.int/esasky-cutout?OBJECT=${encodeURIComponent(query)}&SURVEY=DSS2%20color&WIDTH=400&HEIGHT=400&FOV=${fov}&FORMAT=png`;
    return url;
  }
  return 'https://placehold.co/400x200?text=No+Target';
} 