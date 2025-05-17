// Utility to generate a SkyView thumbnail URL for a given RA/Dec and FOV
// Usage: getSkyViewThumbnailUrl({ ra, dec, fovArcmin, survey, pixels })

function arcminToDeg(arcmin: number) {
  return arcmin / 60;
}

export function getSkyViewThumbnailUrl({
  ra,
  dec,
  fovArcmin = 30, // default FOV in arcminutes
  survey = 'DSS2 Red',
  pixels = 400,
}: {
  ra: string,
  dec: string,
  fovArcmin?: number,
  survey?: string,
  pixels?: number,
}) {
  // SkyView expects FOV in degrees
  const fovDeg = arcminToDeg(fovArcmin);
  const encodedPos = encodeURIComponent(`${ra},${dec}`);
  const encodedSurvey = encodeURIComponent(survey);
  return `https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${encodedPos}&Survey=${encodedSurvey}&Return=JPEG&Sampler=Clip&Size=${fovDeg}&Pixels=${pixels}`;
} 