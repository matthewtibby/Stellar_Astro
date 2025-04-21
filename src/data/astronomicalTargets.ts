export interface AstronomicalTarget {
  id: string;
  name: string;
  type: 'messier' | 'ngc' | 'ic' | 'other';
  catalogId?: string; // e.g., M31, NGC 224, IC 434
  commonNames: string[];
  category: 'galaxy' | 'nebula' | 'star cluster' | 'supernova remnant' | 'other';
  constellation: string;
  coordinates: {
    ra: string; // Right ascension
    dec: string; // Declination
  };
}

export const astronomicalTargets: AstronomicalTarget[] = [
  {
    id: 'm31',
    name: 'Andromeda Galaxy',
    type: 'messier',
    catalogId: 'M31',
    commonNames: ['Andromeda', 'Great Andromeda Nebula'],
    category: 'galaxy',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 42m 44.3s',
      dec: '+41° 16\' 9"'
    }
  },
  {
    id: 'm42',
    name: 'Orion Nebula',
    type: 'messier',
    catalogId: 'M42',
    commonNames: ['Great Nebula in Orion', 'Great Orion Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 35m 17.3s',
      dec: '-05° 23\' 28"'
    }
  },
  {
    id: 'm45',
    name: 'Pleiades',
    type: 'messier',
    catalogId: 'M45',
    commonNames: ['Seven Sisters', 'Subaru'],
    category: 'star cluster',
    constellation: 'Taurus',
    coordinates: {
      ra: '03h 47m 24s',
      dec: '+24° 07\' 00"'
    }
  },
  {
    id: 'ngc7000',
    name: 'North America Nebula',
    type: 'ngc',
    catalogId: 'NGC 7000',
    commonNames: ['North America Nebula'],
    category: 'nebula',
    constellation: 'Cygnus',
    coordinates: {
      ra: '20h 59m 17.1s',
      dec: '+44° 31\' 44"'
    }
  },
  {
    id: 'ic434',
    name: 'Horsehead Nebula',
    type: 'ic',
    catalogId: 'IC 434',
    commonNames: ['Horsehead Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 40m 59.0s',
      dec: '-02° 27\' 30.0"'
    }
  },
  {
    id: 'm1',
    name: 'Crab Nebula',
    type: 'messier',
    catalogId: 'M1',
    commonNames: ['Crab Nebula'],
    category: 'supernova remnant',
    constellation: 'Taurus',
    coordinates: {
      ra: '05h 34m 31.94s',
      dec: '+22° 00\' 52.2"'
    }
  },
  {
    id: 'ngc2237',
    name: 'Rosette Nebula',
    type: 'ngc',
    catalogId: 'NGC 2237',
    commonNames: ['Rosette Nebula'],
    category: 'nebula',
    constellation: 'Monoceros',
    coordinates: {
      ra: '06h 33m 45s',
      dec: '+05° 00\' 00"'
    }
  },
  {
    id: 'ngc1952',
    name: 'Crab Nebula',
    type: 'ngc',
    catalogId: 'NGC 1952',
    commonNames: ['Crab Nebula', 'M1'],
    category: 'supernova remnant',
    constellation: 'Taurus',
    coordinates: {
      ra: '05h 34m 31.94s',
      dec: '+22° 00\' 52.2"'
    }
  },
  {
    id: 'ngc1976',
    name: 'Orion Nebula',
    type: 'ngc',
    catalogId: 'NGC 1976',
    commonNames: ['Orion Nebula', 'M42'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 35m 17.3s',
      dec: '-05° 23\' 28"'
    }
  },
  {
    id: 'ngc224',
    name: 'Andromeda Galaxy',
    type: 'ngc',
    catalogId: 'NGC 224',
    commonNames: ['Andromeda Galaxy', 'M31'],
    category: 'galaxy',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 42m 44.3s',
      dec: '+41° 16\' 9"'
    }
  },
  {
    id: 'ic434',
    name: 'Horsehead Nebula',
    type: 'ic',
    catalogId: 'IC 434',
    commonNames: ['Horsehead Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 40m 59.0s',
      dec: '-02° 27\' 30.0"'
    }
  },
  {
    id: 'ic2118',
    name: 'Witch Head Nebula',
    type: 'ic',
    catalogId: 'IC 2118',
    commonNames: ['Witch Head Nebula'],
    category: 'nebula',
    constellation: 'Eridanus',
    coordinates: {
      ra: '05h 06m 54s',
      dec: '-07° 13\' 00"'
    }
  },
  {
    id: 'ic443',
    name: 'Jellyfish Nebula',
    type: 'ic',
    catalogId: 'IC 443',
    commonNames: ['Jellyfish Nebula'],
    category: 'supernova remnant',
    constellation: 'Gemini',
    coordinates: {
      ra: '06h 17m 13s',
      dec: '+22° 31\' 05"'
    }
  }
];

// Helper function to search targets
export function searchTargets(query: string): AstronomicalTarget[] {
  const lowercaseQuery = query.toLowerCase();
  
  return astronomicalTargets.filter(target => {
    // Check if query matches the name
    if (target.name.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Check if query matches any common names
    if (target.commonNames.some(name => name.toLowerCase().includes(lowercaseQuery))) return true;
    
    // Check if query matches catalog ID
    if (target.catalogId && target.catalogId.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Check if query matches constellation
    if (target.constellation.toLowerCase().includes(lowercaseQuery)) return true;
    
    return false;
  });
} 