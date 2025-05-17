export interface Telescope {
  id: string;
  brand: string;
  model: string;
  aperture: number; // in mm
  focalLength: number; // in mm
  type: 'refractor' | 'reflector' | 'catadioptric';
  mount: 'altazimuth' | 'equatorial' | 'german equatorial' | 'dobsonian';
  description: string;
}

export interface Camera {
  id: string;
  brand: string;
  model: string;
  sensor: string;
  resolution: string;
  pixelSize: number; // in microns
  sensorSize: string;
  cooling: boolean;
  description: string;
}

export interface Filter {
  id: string;
  brand: string;
  model: string;
  type: 'broadband' | 'narrowband' | 'color' | 'uv/ir' | 'light pollution';
  size: number; // in mm
  wavelength?: string; // for narrowband filters
  price: number; // in USD
  description: string;
}

export const telescopes: Telescope[] = [
  {
    id: 'sw-evostar-100ed',
    brand: 'Sky-Watcher',
    model: 'Evostar 100ED',
    aperture: 100,
    focalLength: 900,
    type: 'refractor',
    mount: 'equatorial',
    description: 'A high-quality apochromatic refractor telescope with excellent color correction and sharp optics.'
  },
  {
    id: 'sw-evostar-80ed',
    brand: 'Sky-Watcher',
    model: 'Evostar 80ED',
    aperture: 80,
    focalLength: 600,
    type: 'refractor',
    mount: 'equatorial',
    description: 'Compact and portable apochromatic refractor, perfect for both visual observation and astrophotography.'
  },
  {
    id: 'sw-200p',
    brand: 'Sky-Watcher',
    model: 'Explorer 200P',
    aperture: 200,
    focalLength: 1000,
    type: 'reflector',
    mount: 'equatorial',
    description: 'Large aperture Newtonian reflector offering excellent light-gathering capability for deep-sky observation.'
  },
  {
    id: 'celestron-edgehd-8',
    brand: 'Celestron',
    model: 'EdgeHD 8',
    aperture: 203,
    focalLength: 2032,
    type: 'catadioptric',
    mount: 'german equatorial',
    description: 'Advanced Schmidt-Cassegrain telescope with enhanced edge-to-edge clarity and flat field correction.'
  },
  {
    id: 'celestron-nexstar-6se',
    brand: 'Celestron',
    model: 'NexStar 6SE',
    aperture: 150,
    focalLength: 1500,
    type: 'catadioptric',
    mount: 'altazimuth',
    description: 'Computerized Schmidt-Cassegrain telescope with GoTo mount, perfect for beginners and intermediate users.'
  },
  {
    id: 'meade-lx200-12',
    brand: 'Meade',
    model: 'LX200 12" ACF',
    aperture: 304,
    focalLength: 3048,
    type: 'catadioptric',
    mount: 'german equatorial',
    description: 'Large aperture Advanced Coma-Free telescope with professional-grade optics and mount.'
  },
  {
    id: 'orion-xt8',
    brand: 'Orion',
    model: 'XT8 Classic Dobsonian',
    aperture: 203,
    focalLength: 1200,
    type: 'reflector',
    mount: 'dobsonian',
    description: 'Classic Dobsonian telescope offering excellent value and large aperture for deep-sky observation.'
  },
  {
    id: 'takahashi-fsq-106',
    brand: 'Takahashi',
    model: 'FSQ-106EDX4',
    aperture: 106,
    focalLength: 530,
    type: 'refractor',
    mount: 'german equatorial',
    description: 'Premium quadruplet apochromatic refractor with exceptional flat field and color correction.'
  },
  {
    id: 'william-optics-gt81',
    brand: 'William Optics',
    model: 'GT81 Triplet APO',
    aperture: 81,
    focalLength: 382,
    type: 'refractor',
    mount: 'equatorial',
    description: 'Compact triplet apochromatic refractor with excellent color correction and wide field capability.'
  },
  {
    id: 'skywatcher-quattro-10s',
    brand: 'Sky-Watcher',
    model: 'Quattro 10S',
    aperture: 254,
    focalLength: 1000,
    type: 'reflector',
    mount: 'equatorial',
    description: 'Fast Newtonian reflector optimized for astrophotography with a large flat field.'
  }
];

export const cameras: Camera[] = [
  {
    id: 'zwo-asi294mc',
    brand: 'ZWO',
    model: 'ASI294MC Pro',
    sensor: 'CMOS',
    resolution: '4144×2822',
    pixelSize: 4.63,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'One-shot color CMOS camera with excellent sensitivity and low noise for deep-sky imaging.'
  },
  {
    id: 'zwo-asi533mc',
    brand: 'ZWO',
    model: 'ASI533MC Pro',
    sensor: 'CMOS',
    resolution: '3008×3008',
    pixelSize: 3.76,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'Square format CMOS camera with high sensitivity and low read noise.'
  },
  {
    id: 'zwo-asi2600mm',
    brand: 'ZWO',
    model: 'ASI2600MM Pro',
    sensor: 'CMOS',
    resolution: '6248×4176',
    pixelSize: 3.76,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'Monochrome CMOS camera with excellent dynamic range and low noise for professional imaging.'
  },
  {
    id: 'qhy-ccd-168c',
    brand: 'QHY',
    model: '168C',
    sensor: 'CMOS',
    resolution: '4656×3520',
    pixelSize: 3.8,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'One-shot color CMOS camera with good sensitivity and low noise for deep-sky imaging.'
  },
  {
    id: 'qhy-ccd-600',
    brand: 'QHY',
    model: '600',
    sensor: 'CMOS',
    resolution: '9600×6422',
    pixelSize: 3.76,
    sensorSize: 'Full Frame',
    cooling: true,
    description: 'Full-frame CMOS camera with excellent sensitivity and low noise for wide-field imaging.'
  },
  {
    id: 'atik-ccd-460ex',
    brand: 'Atik',
    model: '460EX Mono',
    sensor: 'CCD',
    resolution: '2749×2199',
    pixelSize: 4.54,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'Monochrome CCD camera with excellent sensitivity and low noise for deep-sky imaging.'
  },
  {
    id: 'atik-ccd-383l',
    brand: 'Atik',
    model: '383L+ Mono',
    sensor: 'CCD',
    resolution: '3326×2504',
    pixelSize: 5.4,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'Large format monochrome CCD camera with excellent sensitivity and low noise.'
  },
  {
    id: 'fli-ml16803',
    brand: 'FLI',
    model: 'ML16803',
    sensor: 'CCD',
    resolution: '4096×4096',
    pixelSize: 9,
    sensorSize: 'Full Frame',
    cooling: true,
    description: 'Professional-grade monochrome CCD camera with excellent sensitivity and low noise.'
  },
  {
    id: 'fli-ml29050',
    brand: 'FLI',
    model: 'ML29050',
    sensor: 'CCD',
    resolution: '6576×4384',
    pixelSize: 6,
    sensorSize: 'Full Frame',
    cooling: true,
    description: 'Full-frame monochrome CCD camera with excellent sensitivity and low noise for wide-field imaging.'
  },
  {
    id: 'zwo-asi6200mm',
    brand: 'ZWO',
    model: 'ASI6200MM Pro',
    sensor: 'CMOS',
    resolution: '6248×4176',
    pixelSize: 3.76,
    sensorSize: 'APS-C',
    cooling: true,
    description: 'Monochrome CMOS camera with excellent dynamic range and low noise for professional imaging.'
  }
];

export const filters: Filter[] = [
  {
    id: 'zwo-lrgb',
    brand: 'ZWO',
    model: 'LRGB Filter Set',
    type: 'color',
    size: 31,
    price: 199,
    description: 'Standard LRGB filter set for color imaging with excellent color separation.'
  },
  {
    id: 'zwo-ha-7nm',
    brand: 'ZWO',
    model: 'Ha 7nm',
    type: 'narrowband',
    size: 31,
    wavelength: '656nm',
    price: 199,
    description: 'Hydrogen-alpha narrowband filter for capturing emission nebulae.'
  },
  {
    id: 'zwo-oiii-6-5nm',
    brand: 'ZWO',
    model: 'OIII 6.5nm',
    type: 'narrowband',
    size: 31,
    wavelength: '501nm',
    price: 199,
    description: 'Oxygen-III narrowband filter for capturing planetary nebulae and supernova remnants.'
  },
  {
    id: 'zwo-sii-6-5nm',
    brand: 'ZWO',
    model: 'SII 6.5nm',
    type: 'narrowband',
    size: 31,
    wavelength: '672nm',
    price: 199,
    description: 'Sulfur-II narrowband filter for capturing emission nebulae.'
  },
  {
    id: 'zwo-uv-ir',
    brand: 'ZWO',
    model: 'UV/IR Cut',
    type: 'uv/ir',
    size: 31,
    price: 49,
    description: 'UV/IR cut filter for blocking unwanted wavelengths in color imaging.'
  },
  {
    id: 'zwo-dual-band',
    brand: 'ZWO',
    model: 'Dual Band',
    type: 'narrowband',
    size: 31,
    wavelength: 'Ha/OIII',
    price: 299,
    description: 'Dual narrowband filter combining Ha and OIII for color imaging of emission nebulae.'
  },
  {
    id: 'zwo-tri-band',
    brand: 'ZWO',
    model: 'Tri Band',
    type: 'narrowband',
    size: 31,
    wavelength: 'Ha/OIII/SII',
    price: 399,
    description: 'Triple narrowband filter combining Ha, OIII, and SII for color imaging of emission nebulae.'
  },
  {
    id: 'zwo-lp',
    brand: 'ZWO',
    model: 'Light Pollution',
    type: 'light pollution',
    size: 31,
    price: 99,
    description: 'Light pollution filter for reducing the effects of urban light pollution.'
  },
  {
    id: 'zwo-cls',
    brand: 'ZWO',
    model: 'CLS',
    type: 'light pollution',
    size: 31,
    price: 79,
    description: 'City Light Suppression filter for reducing the effects of urban light pollution.'
  },
  {
    id: 'zwo-uhc',
    brand: 'ZWO',
    model: 'UHC',
    type: 'broadband',
    size: 31,
    price: 89,
    description: 'Ultra High Contrast filter for enhancing emission nebulae and reducing light pollution.'
  }
];

// Search functions
export function searchTelescopes(query: string): Telescope[] {
  const searchTerms = query.toLowerCase().split(' ');
  return telescopes.filter(telescope => {
    const searchableText = `${telescope.brand} ${telescope.model} ${telescope.type} ${telescope.mount}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  });
}

export function searchCameras(query: string): Camera[] {
  const searchTerms = query.toLowerCase().split(' ');
  return cameras.filter(camera => {
    const searchableText = `${camera.brand} ${camera.model} ${camera.sensor} ${camera.sensorSize}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  });
}

export function searchFilters(query: string): Filter[] {
  const searchTerms = query.toLowerCase().split(' ');
  return filters.filter(filter => {
    const searchableText = `${filter.brand} ${filter.model} ${filter.type} ${filter.wavelength || ''}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  });
}

// Function to add a custom telescope to the database
export function addCustomTelescope(telescope: Telescope): Telescope {
  // In a real app, this would save to a database
  // For now, we'll just add it to the in-memory array
  telescopes.push(telescope);
  return telescope;
}

// Function to add a custom camera to the database
export function addCustomCamera(camera: Camera): Camera {
  // In a real app, this would save to a database
  // For now, we'll just add it to the in-memory array
  cameras.push(camera);
  return camera;
} 