export interface AstronomicalTarget {
  id: string;
  name: string;
  type: 'messier' | 'ngc' | 'ic' | 'other';
  catalogIds: string[]; // e.g., ['M31', 'NGC 224']
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
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    type: 'messier',
    catalogIds: ['M31', 'NGC 224'],
    commonNames: ['Andromeda', 'Great Andromeda Nebula'],
    category: 'galaxy',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 42m 44.3s',
      dec: '+41° 16\' 9"'
    }
  },
  {
    id: 'orion-nebula',
    name: 'Orion Nebula',
    type: 'messier',
    catalogIds: ['M42', 'NGC 1976'],
    commonNames: ['Great Nebula in Orion', 'Great Orion Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 35m 17.3s',
      dec: '-05° 23\' 28"'
    }
  },
  {
    id: 'pleiades',
    name: 'Pleiades',
    type: 'messier',
    catalogIds: ['M45'],
    commonNames: ['Seven Sisters', 'Subaru'],
    category: 'star cluster',
    constellation: 'Taurus',
    coordinates: {
      ra: '03h 47m 24s',
      dec: '+24° 07\' 00"'
    }
  },
  {
    id: 'north-america-nebula',
    name: 'North America Nebula',
    type: 'ngc',
    catalogIds: ['NGC 7000'],
    commonNames: ['North America Nebula'],
    category: 'nebula',
    constellation: 'Cygnus',
    coordinates: {
      ra: '20h 59m 17.1s',
      dec: '+44° 31\' 44"'
    }
  },
  {
    id: 'horsehead-nebula',
    name: 'Horsehead Nebula',
    type: 'ic',
    catalogIds: ['IC 434'],
    commonNames: ['Horsehead Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 40m 59.0s',
      dec: '-02° 27\' 30.0"'
    }
  },
  {
    id: 'crab-nebula',
    name: 'Crab Nebula',
    type: 'messier',
    catalogIds: ['M1', 'NGC 1952'],
    commonNames: ['Crab Nebula'],
    category: 'supernova remnant',
    constellation: 'Taurus',
    coordinates: {
      ra: '05h 34m 31.94s',
      dec: '+22° 00\' 52.2"'
    }
  },
  {
    id: 'rosette-nebula',
    name: 'Rosette Nebula',
    type: 'ngc',
    catalogIds: ['NGC 2237'],
    commonNames: ['Rosette Nebula'],
    category: 'nebula',
    constellation: 'Monoceros',
    coordinates: {
      ra: '06h 33m 45s',
      dec: '+05° 00\' 00"'
    }
  },
  {
    id: 'witch-head-nebula',
    name: 'Witch Head Nebula',
    type: 'ic',
    catalogIds: ['IC 2118'],
    commonNames: ['Witch Head Nebula'],
    category: 'nebula',
    constellation: 'Eridanus',
    coordinates: {
      ra: '05h 06m 54s',
      dec: '-07° 13\' 00"'
    }
  },
  {
    id: 'jellyfish-nebula',
    name: 'Jellyfish Nebula',
    type: 'ic',
    catalogIds: ['IC 443'],
    commonNames: ['Jellyfish Nebula'],
    category: 'supernova remnant',
    constellation: 'Gemini',
    coordinates: {
      ra: '06h 17m 13s',
      dec: '+22° 31\' 05"'
    }
  },
  {
    id: 'whirlpool-galaxy',
    name: 'Whirlpool Galaxy',
    type: 'messier',
    catalogIds: ['M51', 'NGC 5194'],
    commonNames: ['Whirlpool Galaxy', 'Messier 51a'],
    category: 'galaxy',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '13h 29m 52.7s',
      dec: '+47° 11\' 43"'
    }
  },
  {
    id: 'sombrero-galaxy',
    name: 'Sombrero Galaxy',
    type: 'messier',
    catalogIds: ['M104', 'NGC 4594'],
    commonNames: ['Sombrero Galaxy'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 39m 59.4s',
      dec: '-11° 37\' 23"'
    }
  },
  {
    id: 'ring-nebula',
    name: 'Ring Nebula',
    type: 'messier',
    catalogIds: ['M57', 'NGC 6720'],
    commonNames: ['Ring Nebula'],
    category: 'nebula',
    constellation: 'Lyra',
    coordinates: {
      ra: '18h 53m 35.1s',
      dec: '+33° 01\' 45"'
    }
  },
  {
    id: 'dumbbell-nebula',
    name: 'Dumbbell Nebula',
    type: 'messier',
    catalogIds: ['M27', 'NGC 6853'],
    commonNames: ['Dumbbell Nebula', 'Apple Core Nebula'],
    category: 'nebula',
    constellation: 'Vulpecula',
    coordinates: {
      ra: '19h 59m 36.3s',
      dec: '+22° 43\' 16"'
    }
  },
  {
    id: 'eagle-nebula',
    name: 'Eagle Nebula',
    type: 'messier',
    catalogIds: ['M16', 'NGC 6611'],
    commonNames: ['Eagle Nebula', 'Star Queen Nebula'],
    category: 'nebula',
    constellation: 'Serpens',
    coordinates: {
      ra: '18h 18m 48s',
      dec: '-13° 49\' 00"'
    }
  },
  {
    id: 'omega-nebula',
    name: 'Omega Nebula',
    type: 'messier',
    catalogIds: ['M17', 'NGC 6618'],
    commonNames: ['Omega Nebula', 'Swan Nebula', 'Horseshoe Nebula'],
    category: 'nebula',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 20m 26s',
      dec: '-16° 10\' 36"'
    }
  },
  {
    id: 'lagoon-nebula',
    name: 'Lagoon Nebula',
    type: 'messier',
    catalogIds: ['M8', 'NGC 6523'],
    commonNames: ['Lagoon Nebula'],
    category: 'nebula',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 03m 37s',
      dec: '-24° 23\' 12"'
    }
  },
  {
    id: 'trifid-nebula',
    name: 'Trifid Nebula',
    type: 'messier',
    catalogIds: ['M20', 'NGC 6514'],
    commonNames: ['Trifid Nebula'],
    category: 'nebula',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 02m 23s',
      dec: '-23° 01\' 48"'
    }
  },
  {
    id: 'veil-nebula',
    name: 'Veil Nebula',
    type: 'ngc',
    catalogIds: ['NGC 6960', 'NGC 6979', 'NGC 6992', 'NGC 6995'],
    commonNames: ['Veil Nebula', 'Cygnus Loop', 'Filamentary Nebula'],
    category: 'supernova remnant',
    constellation: 'Cygnus',
    coordinates: {
      ra: '20h 45m 38s',
      dec: '+30° 42\' 30"'
    }
  },
  {
    id: 'helix-nebula',
    name: 'Helix Nebula',
    type: 'ngc',
    catalogIds: ['NGC 7293'],
    commonNames: ['Helix Nebula', 'Eye of God'],
    category: 'nebula',
    constellation: 'Aquarius',
    coordinates: {
      ra: '22h 29m 38.55s',
      dec: '-20° 50\' 13.6"'
    }
  },
  {
    id: 'cat-eye-nebula',
    name: 'Cat\'s Eye Nebula',
    type: 'ngc',
    catalogIds: ['NGC 6543'],
    commonNames: ['Cat\'s Eye Nebula'],
    category: 'nebula',
    constellation: 'Draco',
    coordinates: {
      ra: '17h 58m 33.4s',
      dec: '+66° 37\' 59.5"'
    }
  },
  {
    id: 'butterfly-nebula',
    name: 'Butterfly Nebula',
    type: 'ngc',
    catalogIds: ['NGC 6302'],
    commonNames: ['Butterfly Nebula', 'Bug Nebula'],
    category: 'nebula',
    constellation: 'Scorpius',
    coordinates: {
      ra: '17h 13m 44.2s',
      dec: '-37° 06\' 16"'
    }
  },
  {
    id: 'southern-ring-nebula',
    name: 'Southern Ring Nebula',
    type: 'ngc',
    catalogIds: ['NGC 3132'],
    commonNames: ['Southern Ring Nebula', 'Eight-Burst Nebula'],
    category: 'nebula',
    constellation: 'Vela',
    coordinates: {
      ra: '10h 07m 01.8s',
      dec: '-40° 26\' 11"'
    }
  },
  {
    id: 'carina-nebula',
    name: 'Carina Nebula',
    type: 'ngc',
    catalogIds: ['NGC 3372'],
    commonNames: ['Carina Nebula', 'Eta Carinae Nebula'],
    category: 'nebula',
    constellation: 'Carina',
    coordinates: {
      ra: '10h 45m 08.5s',
      dec: '-59° 52\' 04"'
    }
  },
  {
    id: 'tarantula-nebula',
    name: 'Tarantula Nebula',
    type: 'ngc',
    catalogIds: ['NGC 2070'],
    commonNames: ['Tarantula Nebula', '30 Doradus'],
    category: 'nebula',
    constellation: 'Dorado',
    coordinates: {
      ra: '05h 38m 38s',
      dec: '-69° 05.7\' 00"'
    }
  },
  {
    id: 'keyhole-nebula',
    name: 'Keyhole Nebula',
    type: 'ngc',
    catalogIds: ['NGC 3324'],
    commonNames: ['Keyhole Nebula'],
    category: 'nebula',
    constellation: 'Carina',
    coordinates: {
      ra: '10h 37m 18s',
      dec: '-58° 38\' 00"'
    }
  },
  {
    id: 'eskiimo-nebula',
    name: 'Eskimo Nebula',
    type: 'ngc',
    catalogIds: ['NGC 2392'],
    commonNames: ['Eskimo Nebula', 'Clownface Nebula'],
    category: 'nebula',
    constellation: 'Gemini',
    coordinates: {
      ra: '07h 29m 10.8s',
      dec: '+20° 54\' 42.5"'
    }
  },
  {
    id: 'owl-nebula',
    name: 'Owl Nebula',
    type: 'messier',
    catalogIds: ['M97', 'NGC 3587'],
    commonNames: ['Owl Nebula'],
    category: 'nebula',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '11h 14m 47.7s',
      dec: '+55° 01\' 08"'
    }
  },
  {
    id: 'black-eye-galaxy',
    name: 'Black Eye Galaxy',
    type: 'messier',
    catalogIds: ['M64', 'NGC 4826'],
    commonNames: ['Black Eye Galaxy', 'Evil Eye Galaxy'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 56m 43.7s',
      dec: '+21° 40\' 58"'
    }
  },
  {
    id: 'pinwheel-galaxy',
    name: 'Pinwheel Galaxy',
    type: 'messier',
    catalogIds: ['M101', 'NGC 5457'],
    commonNames: ['Pinwheel Galaxy'],
    category: 'galaxy',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '14h 03m 12.6s',
      dec: '+54° 20\' 57"'
    }
  },
  {
    id: 'triangulum-galaxy',
    name: 'Triangulum Galaxy',
    type: 'messier',
    catalogIds: ['M33', 'NGC 598'],
    commonNames: ['Triangulum Galaxy', 'Pinwheel Galaxy'],
    category: 'galaxy',
    constellation: 'Triangulum',
    coordinates: {
      ra: '01h 33m 50.9s',
      dec: '+30° 39\' 37"'
    }
  },
  {
    id: 'bodes-galaxy',
    name: 'Bode\'s Galaxy',
    type: 'messier',
    catalogIds: ['M81', 'NGC 3031'],
    commonNames: ['Bode\'s Galaxy'],
    category: 'galaxy',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '09h 55m 33.2s',
      dec: '+69° 03\' 55"'
    }
  },
  {
    id: 'cigar-galaxy',
    name: 'Cigar Galaxy',
    type: 'messier',
    catalogIds: ['M82', 'NGC 3034'],
    commonNames: ['Cigar Galaxy'],
    category: 'galaxy',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '09h 55m 52.2s',
      dec: '+69° 40\' 47"'
    }
  },
  {
    id: 'southern-pinwheel-galaxy',
    name: 'Southern Pinwheel Galaxy',
    type: 'messier',
    catalogIds: ['M83', 'NGC 5236'],
    commonNames: ['Southern Pinwheel Galaxy'],
    category: 'galaxy',
    constellation: 'Hydra',
    coordinates: {
      ra: '13h 37m 00.9s',
      dec: '-29° 51\' 57"'
    }
  },
  {
    id: 'sunflower-galaxy',
    name: 'Sunflower Galaxy',
    type: 'messier',
    catalogIds: ['M63', 'NGC 5055'],
    commonNames: ['Sunflower Galaxy'],
    category: 'galaxy',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '13h 15m 49.3s',
      dec: '+42° 01\' 45"'
    }
  },
  {
    id: 'needle-galaxy',
    name: 'Needle Galaxy',
    type: 'ngc',
    catalogIds: ['NGC 4565'],
    commonNames: ['Needle Galaxy'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 36m 20.8s',
      dec: '+25° 59\' 15.6"'
    }
  },
  {
    id: 'silver-coin-galaxy',
    name: 'Silver Coin Galaxy',
    type: 'ngc',
    catalogIds: ['NGC 253'],
    commonNames: ['Silver Coin Galaxy', 'Sculptor Galaxy'],
    category: 'galaxy',
    constellation: 'Sculptor',
    coordinates: {
      ra: '00h 47m 33s',
      dec: '-25° 17\' 18"'
    }
  },
  {
    id: 'cartwheel-galaxy',
    name: 'Cartwheel Galaxy',
    type: 'ngc',
    catalogIds: ['NGC 224'],
    commonNames: ['Cartwheel Galaxy'],
    category: 'galaxy',
    constellation: 'Sculptor',
    coordinates: {
      ra: '00h 37m 41.1s',
      dec: '-33° 42\' 59"'
    }
  },
  {
    id: 'antennae-galaxies',
    name: 'Antennae Galaxies',
    type: 'ngc',
    catalogIds: ['NGC 4038', 'NGC 4039'],
    commonNames: ['Antennae Galaxies', 'Ringtail Galaxy'],
    category: 'galaxy',
    constellation: 'Corvus',
    coordinates: {
      ra: '12h 01m 53.0s',
      dec: '-18° 52\' 10"'
    }
  },
  {
    id: 'mice-galaxies',
    name: 'Mice Galaxies',
    type: 'ngc',
    catalogIds: ['NGC 4676'],
    commonNames: ['Mice Galaxies'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 46m 10.1s',
      dec: '+30° 43\' 55"'
    }
  },
  {
    id: 'butterfly-galaxies',
    name: 'Butterfly Galaxies',
    type: 'ngc',
    catalogIds: ['NGC 4567', 'NGC 4568'],
    commonNames: ['Butterfly Galaxies', 'Siamese Twins'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 36m 32.8s',
      dec: '+11° 15\' 30"'
    }
  },
  {
    id: 'eyes-galaxies',
    name: 'Eyes Galaxies',
    type: 'ngc',
    catalogIds: ['NGC 4435', 'NGC 4438'],
    commonNames: ['Eyes Galaxies', 'Markarian\'s Eyes'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 27m 45.6s',
      dec: '+13° 00\' 32"'
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
    
    // Check if query matches any catalog IDs
    if (target.catalogIds.some(id => id.toLowerCase().includes(lowercaseQuery))) return true;
    
    // Check if query matches constellation
    if (target.constellation.toLowerCase().includes(lowercaseQuery)) return true;
    
    return false;
  });
} 