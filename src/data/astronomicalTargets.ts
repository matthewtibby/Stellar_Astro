export interface AstronomicalTarget {
  id: string;
  name: string;
  type: 'messier' | 'ngc' | 'ic' | 'other';
  catalogIds: string[]; // e.g., ['M31', 'NGC 224']
  commonNames: string[];
  category: 'galaxy' | 'nebula' | 'star cluster' | 'supernova remnant' | 'binary star' | 'other';
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
  },
  {
    id: 'hercules-cluster',
    name: 'Hercules Cluster',
    type: 'messier',
    catalogIds: ['M13', 'NGC 6205'],
    commonNames: ['Great Globular Cluster in Hercules', 'Hercules Globular Cluster'],
    category: 'star cluster',
    constellation: 'Hercules',
    coordinates: {
      ra: '16h 41m 41.2s',
      dec: '+36° 27\' 35.5"'
    }
  },
  {
    id: 'omega-centauri',
    name: 'Omega Centauri',
    type: 'ngc',
    catalogIds: ['NGC 5139'],
    commonNames: ['Omega Centauri'],
    category: 'star cluster',
    constellation: 'Centaurus',
    coordinates: {
      ra: '13h 26m 47.28s',
      dec: '-47° 28\' 46.1"'
    }
  },
  {
    id: 'beehive-cluster',
    name: 'Beehive Cluster',
    type: 'messier',
    catalogIds: ['M44', 'NGC 2632'],
    commonNames: ['Beehive Cluster', 'Praesepe'],
    category: 'star cluster',
    constellation: 'Cancer',
    coordinates: {
      ra: '08h 40m 24s',
      dec: '+19° 40\' 00"'
    }
  },
  {
    id: 'wild-duck-cluster',
    name: 'Wild Duck Cluster',
    type: 'messier',
    catalogIds: ['M11', 'NGC 6705'],
    commonNames: ['Wild Duck Cluster'],
    category: 'star cluster',
    constellation: 'Scutum',
    coordinates: {
      ra: '18h 51m 05.0s',
      dec: '-06° 16\' 12"'
    }
  },
  {
    id: 'butterfly-cluster',
    name: 'Butterfly Cluster',
    type: 'messier',
    catalogIds: ['M6', 'NGC 6405'],
    commonNames: ['Butterfly Cluster'],
    category: 'star cluster',
    constellation: 'Scorpius',
    coordinates: {
      ra: '17h 40m 20.0s',
      dec: '-32° 15\' 15"'
    }
  },
  {
    id: 'jewel-box-cluster',
    name: 'Jewel Box Cluster',
    type: 'ngc',
    catalogIds: ['NGC 4755'],
    commonNames: ['Jewel Box Cluster', 'Kappa Crucis Cluster'],
    category: 'star cluster',
    constellation: 'Crux',
    coordinates: {
      ra: '12h 53m 42s',
      dec: '-60° 22\' 00"'
    }
  },
  {
    id: 'double-cluster',
    name: 'Double Cluster',
    type: 'ngc',
    catalogIds: ['NGC 869', 'NGC 884'],
    commonNames: ['Double Cluster', 'h and Chi Persei'],
    category: 'star cluster',
    constellation: 'Perseus',
    coordinates: {
      ra: '02h 20m 00s',
      dec: '+57° 08\' 00"'
    }
  },
  {
    id: 'eta-carinae',
    name: 'Eta Carinae',
    type: 'other',
    catalogIds: ['HD 93308'],
    commonNames: ['Eta Carinae', 'Homunculus Nebula'],
    category: 'binary star',
    constellation: 'Carina',
    coordinates: {
      ra: '10h 45m 03.6s',
      dec: '-59° 41\' 04"'
    }
  },
  {
    id: 'algol',
    name: 'Algol',
    type: 'other',
    catalogIds: ['Beta Persei', 'HD 19356'],
    commonNames: ['Algol', 'Demon Star'],
    category: 'binary star',
    constellation: 'Perseus',
    coordinates: {
      ra: '03h 08m 10.1s',
      dec: '+40° 57\' 20"'
    }
  },
  {
    id: 'albireo',
    name: 'Albireo',
    type: 'other',
    catalogIds: ['Beta Cygni', 'HD 183912'],
    commonNames: ['Albireo'],
    category: 'binary star',
    constellation: 'Cygnus',
    coordinates: {
      ra: '19h 30m 43.3s',
      dec: '+27° 57\' 34"'
    }
  },
  {
    id: 'mizar-alcor',
    name: 'Mizar and Alcor',
    type: 'other',
    catalogIds: ['Zeta Ursae Majoris', '80 Ursae Majoris'],
    commonNames: ['Mizar and Alcor', 'Horse and Rider'],
    category: 'binary star',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '13h 23m 55.5s',
      dec: '+54° 55\' 31"'
    }
  },
  {
    id: 'sirius',
    name: 'Sirius',
    type: 'other',
    catalogIds: ['Alpha Canis Majoris', 'HD 48915'],
    commonNames: ['Sirius', 'Dog Star'],
    category: 'binary star',
    constellation: 'Canis Major',
    coordinates: {
      ra: '06h 45m 08.9s',
      dec: '-16° 42\' 58"'
    }
  },
  {
    id: 'procyon',
    name: 'Procyon',
    type: 'other',
    catalogIds: ['Alpha Canis Minoris', 'HD 61421'],
    commonNames: ['Procyon'],
    category: 'binary star',
    constellation: 'Canis Minor',
    coordinates: {
      ra: '07h 39m 18.1s',
      dec: '+05° 13\' 30"'
    }
  },
  {
    id: 'spica',
    name: 'Spica',
    type: 'other',
    catalogIds: ['Alpha Virginis', 'HD 116658'],
    commonNames: ['Spica'],
    category: 'binary star',
    constellation: 'Virgo',
    coordinates: {
      ra: '13h 25m 11.6s',
      dec: '-11° 09\' 40"'
    }
  },
  {
    id: 'antares',
    name: 'Antares',
    type: 'other',
    catalogIds: ['Alpha Scorpii', 'HD 148478'],
    commonNames: ['Antares', 'Heart of the Scorpion'],
    category: 'binary star',
    constellation: 'Scorpius',
    coordinates: {
      ra: '16h 29m 24.4s',
      dec: '-26° 25\' 55"'
    }
  },
  {
    id: 'arcturus',
    name: 'Arcturus',
    type: 'other',
    catalogIds: ['Alpha Boötis', 'HD 124897'],
    commonNames: ['Arcturus'],
    category: 'binary star',
    constellation: 'Boötes',
    coordinates: {
      ra: '14h 15m 39.7s',
      dec: '+19° 10\' 57"'
    }
  },
  {
    id: 'vega',
    name: 'Vega',
    type: 'other',
    catalogIds: ['Alpha Lyrae', 'HD 172167'],
    commonNames: ['Vega'],
    category: 'binary star',
    constellation: 'Lyra',
    coordinates: {
      ra: '18h 36m 56.3s',
      dec: '+38° 47\' 01"'
    }
  },
  {
    id: 'capella',
    name: 'Capella',
    type: 'other',
    catalogIds: ['Alpha Aurigae', 'HD 34029'],
    commonNames: ['Capella'],
    category: 'binary star',
    constellation: 'Auriga',
    coordinates: {
      ra: '05h 16m 41.4s',
      dec: '+45° 59\' 53"'
    }
  },
  {
    id: 'rigel',
    name: 'Rigel',
    type: 'other',
    catalogIds: ['Beta Orionis', 'HD 34085'],
    commonNames: ['Rigel'],
    category: 'binary star',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 14m 32.3s',
      dec: '-08° 12\' 06"'
    }
  },
  {
    id: 'betelgeuse',
    name: 'Betelgeuse',
    type: 'other',
    catalogIds: ['Alpha Orionis', 'HD 39801'],
    commonNames: ['Betelgeuse'],
    category: 'binary star',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 55m 10.3s',
      dec: '+07° 24\' 25"'
    }
  },
  {
    id: 'altair',
    name: 'Altair',
    type: 'other',
    catalogIds: ['Alpha Aquilae', 'HD 187642'],
    commonNames: ['Altair'],
    category: 'binary star',
    constellation: 'Aquila',
    coordinates: {
      ra: '19h 50m 47.0s',
      dec: '+08° 52\' 06"'
    }
  },
  {
    id: 'deneb',
    name: 'Deneb',
    type: 'other',
    catalogIds: ['Alpha Cygni', 'HD 197345'],
    commonNames: ['Deneb'],
    category: 'binary star',
    constellation: 'Cygnus',
    coordinates: {
      ra: '20h 41m 25.9s',
      dec: '+45° 16\' 49"'
    }
  },
  {
    id: 'fomalhaut',
    name: 'Fomalhaut',
    type: 'other',
    catalogIds: ['Alpha Piscis Austrini', 'HD 216956'],
    commonNames: ['Fomalhaut'],
    category: 'binary star',
    constellation: 'Piscis Austrinus',
    coordinates: {
      ra: '22h 57m 39.0s',
      dec: '-29° 37\' 20"'
    }
  },
  {
    id: 'pollux',
    name: 'Pollux',
    type: 'other',
    catalogIds: ['Beta Geminorum', 'HD 62509'],
    commonNames: ['Pollux'],
    category: 'binary star',
    constellation: 'Gemini',
    coordinates: {
      ra: '07h 45m 19.4s',
      dec: '+28° 01\' 34"'
    }
  },
  {
    id: 'castor',
    name: 'Castor',
    type: 'other',
    catalogIds: ['Alpha Geminorum', 'HD 60179'],
    commonNames: ['Castor'],
    category: 'binary star',
    constellation: 'Gemini',
    coordinates: {
      ra: '07h 34m 36.0s',
      dec: '+31° 53\' 18"'
    }
  },
  {
    id: 'regulus',
    name: 'Regulus',
    type: 'other',
    catalogIds: ['Alpha Leonis', 'HD 87901'],
    commonNames: ['Regulus'],
    category: 'binary star',
    constellation: 'Leo',
    coordinates: {
      ra: '10h 08m 22.3s',
      dec: '+11° 58\' 02"'
    }
  },
  {
    id: 'aldebaran',
    name: 'Aldebaran',
    type: 'other',
    catalogIds: ['Alpha Tauri', 'HD 29139'],
    commonNames: ['Aldebaran', 'Eye of the Bull'],
    category: 'binary star',
    constellation: 'Taurus',
    coordinates: {
      ra: '04h 35m 55.2s',
      dec: '+16° 30\' 33"'
    }
  },
  {
    id: 'bellatrix',
    name: 'Bellatrix',
    type: 'other',
    catalogIds: ['Gamma Orionis', 'HD 35468'],
    commonNames: ['Bellatrix', 'Amazon Star'],
    category: 'binary star',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 25m 07.9s',
      dec: '+06° 20\' 59"'
    }
  },
  {
    id: 'el-nath',
    name: 'El Nath',
    type: 'other',
    catalogIds: ['Beta Tauri', 'HD 35497'],
    commonNames: ['El Nath'],
    category: 'binary star',
    constellation: 'Taurus',
    coordinates: {
      ra: '05h 26m 17.5s',
      dec: '+28° 36\' 27"'
    }
  },
  {
    id: 'mirach',
    name: 'Mirach',
    type: 'other',
    catalogIds: ['Beta Andromedae', 'HD 6860'],
    commonNames: ['Mirach'],
    category: 'binary star',
    constellation: 'Andromeda',
    coordinates: {
      ra: '01h 09m 43.9s',
      dec: '+35° 37\' 14"'
    }
  },
  {
    id: 'algenib',
    name: 'Algenib',
    type: 'other',
    catalogIds: ['Gamma Pegasi', 'HD 886'],
    commonNames: ['Algenib'],
    category: 'binary star',
    constellation: 'Pegasus',
    coordinates: {
      ra: '00h 13m 14.2s',
      dec: '+15° 11\' 01"'
    }
  },
  {
    id: 'alpheratz',
    name: 'Alpheratz',
    type: 'other',
    catalogIds: ['Alpha Andromedae', 'HD 358'],
    commonNames: ['Alpheratz', 'Sirrah'],
    category: 'binary star',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 08m 23.3s',
      dec: '+29° 05\' 26"'
    }
  },
  {
    id: 'diphda',
    name: 'Diphda',
    type: 'other',
    catalogIds: ['Beta Ceti', 'HD 4128'],
    commonNames: ['Diphda', 'Deneb Kaitos'],
    category: 'binary star',
    constellation: 'Cetus',
    coordinates: {
      ra: '00h 43m 35.4s',
      dec: '-17° 59\' 12"'
    }
  },
  {
    id: 'nashira',
    name: 'Nashira',
    type: 'other',
    catalogIds: ['Gamma Capricorni', 'HD 206088'],
    commonNames: ['Nashira'],
    category: 'binary star',
    constellation: 'Capricornus',
    coordinates: {
      ra: '21h 40m 05.4s',
      dec: '-16° 39\' 44"'
    }
  },
  {
    id: 'sadalsuud',
    name: 'Sadalsuud',
    type: 'other',
    catalogIds: ['Beta Aquarii', 'HD 204867'],
    commonNames: ['Sadalsuud'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '21h 31m 33.5s',
      dec: '-05° 34\' 16"'
    }
  },
  {
    id: 'sadalmelik',
    name: 'Sadalmelik',
    type: 'other',
    catalogIds: ['Alpha Aquarii', 'HD 209750'],
    commonNames: ['Sadalmelik'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '22h 05m 47.0s',
      dec: '-00° 19\' 11"'
    }
  },
  {
    id: 'sadachbia',
    name: 'Sadachbia',
    type: 'other',
    catalogIds: ['Gamma Aquarii', 'HD 206088'],
    commonNames: ['Sadachbia'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '22h 21m 39.4s',
      dec: '-01° 23\' 14"'
    }
  },
  {
    id: 'sadalsuud',
    name: 'Sadalsuud',
    type: 'other',
    catalogIds: ['Beta Aquarii', 'HD 204867'],
    commonNames: ['Sadalsuud'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '21h 31m 33.5s',
      dec: '-05° 34\' 16"'
    }
  },
  {
    id: 'sadalmelik',
    name: 'Sadalmelik',
    type: 'other',
    catalogIds: ['Alpha Aquarii', 'HD 209750'],
    commonNames: ['Sadalmelik'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '22h 05m 47.0s',
      dec: '-00° 19\' 11"'
    }
  },
  {
    id: 'sadachbia',
    name: 'Sadachbia',
    type: 'other',
    catalogIds: ['Gamma Aquarii', 'HD 206088'],
    commonNames: ['Sadachbia'],
    category: 'binary star',
    constellation: 'Aquarius',
    coordinates: {
      ra: '22h 21m 39.4s',
      dec: '-01° 23\' 14"'
    }
  },
  {
    id: 'm2',
    name: 'Messier 2',
    type: 'messier',
    catalogIds: ['M2', 'NGC 7089'],
    commonNames: ['Messier 2'],
    category: 'star cluster',
    constellation: 'Aquarius',
    coordinates: {
      ra: '21h 33m 27.02s',
      dec: '-00° 49\' 23.7"'
    }
  },
  {
    id: 'm3',
    name: 'Messier 3',
    type: 'messier',
    catalogIds: ['M3', 'NGC 5272'],
    commonNames: ['Messier 3'],
    category: 'star cluster',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '13h 42m 11.62s',
      dec: '+28° 22\' 38.2"'
    }
  },
  {
    id: 'm4',
    name: 'Messier 4',
    type: 'messier',
    catalogIds: ['M4', 'NGC 6121'],
    commonNames: ['Messier 4'],
    category: 'star cluster',
    constellation: 'Scorpius',
    coordinates: {
      ra: '16h 23m 35.22s',
      dec: '-26° 31\' 32.7"'
    }
  },
  {
    id: 'm5',
    name: 'Messier 5',
    type: 'messier',
    catalogIds: ['M5', 'NGC 5904'],
    commonNames: ['Messier 5'],
    category: 'star cluster',
    constellation: 'Serpens',
    coordinates: {
      ra: '15h 18m 33.22s',
      dec: '+02° 04\' 51.7"'
    }
  },
  {
    id: 'm7',
    name: 'Messier 7',
    type: 'messier',
    catalogIds: ['M7', 'NGC 6475'],
    commonNames: ['Ptolemy\'s Cluster'],
    category: 'star cluster',
    constellation: 'Scorpius',
    coordinates: {
      ra: '17h 53m 51.2s',
      dec: '-34° 47\' 34"'
    }
  },
  {
    id: 'm9',
    name: 'Messier 9',
    type: 'messier',
    catalogIds: ['M9', 'NGC 6333'],
    commonNames: ['Messier 9'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '17h 19m 11.78s',
      dec: '-18° 30\' 58.5"'
    }
  },
  {
    id: 'm10',
    name: 'Messier 10',
    type: 'messier',
    catalogIds: ['M10', 'NGC 6254'],
    commonNames: ['Messier 10'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '16h 57m 08.99s',
      dec: '-04° 05\' 58.1"'
    }
  },
  {
    id: 'm12',
    name: 'Messier 12',
    type: 'messier',
    catalogIds: ['M12', 'NGC 6218'],
    commonNames: ['Messier 12'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '16h 47m 14.18s',
      dec: '-01° 56\' 54.7"'
    }
  },
  {
    id: 'm14',
    name: 'Messier 14',
    type: 'messier',
    catalogIds: ['M14', 'NGC 6402'],
    commonNames: ['Messier 14'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '17h 37m 36.15s',
      dec: '-03° 14\' 45.3"'
    }
  },
  {
    id: 'm15',
    name: 'Messier 15',
    type: 'messier',
    catalogIds: ['M15', 'NGC 7078'],
    commonNames: ['Great Pegasus Cluster'],
    category: 'star cluster',
    constellation: 'Pegasus',
    coordinates: {
      ra: '21h 29m 58.33s',
      dec: '+12° 10\' 01.2"'
    }
  },
  {
    id: 'm18',
    name: 'Messier 18',
    type: 'messier',
    catalogIds: ['M18', 'NGC 6613'],
    commonNames: ['Messier 18'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 19m 58.0s',
      dec: '-17° 06\' 06"'
    }
  },
  {
    id: 'm19',
    name: 'Messier 19',
    type: 'messier',
    catalogIds: ['M19', 'NGC 6273'],
    commonNames: ['Messier 19'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '17h 02m 37.69s',
      dec: '-26° 16\' 04.7"'
    }
  },
  {
    id: 'm21',
    name: 'Messier 21',
    type: 'messier',
    catalogIds: ['M21', 'NGC 6531'],
    commonNames: ['Messier 21'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 04m 13.4s',
      dec: '-22° 30\' 05"'
    }
  },
  {
    id: 'm22',
    name: 'Messier 22',
    type: 'messier',
    catalogIds: ['M22', 'NGC 6656'],
    commonNames: ['Sagittarius Cluster'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 36m 23.94s',
      dec: '-23° 54\' 17.1"'
    }
  },
  {
    id: 'm23',
    name: 'Messier 23',
    type: 'messier',
    catalogIds: ['M23', 'NGC 6494'],
    commonNames: ['Messier 23'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '17h 56m 48.0s',
      dec: '-19° 00\' 54"'
    }
  },
  {
    id: 'm24',
    name: 'Messier 24',
    type: 'messier',
    catalogIds: ['M24', 'NGC 6603'],
    commonNames: ['Sagittarius Star Cloud'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 17m 00.0s',
      dec: '-18° 29\' 00"'
    }
  },
  {
    id: 'm25',
    name: 'Messier 25',
    type: 'messier',
    catalogIds: ['M25', 'IC 4725'],
    commonNames: ['Messier 25'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 31m 47.0s',
      dec: '-19° 07\' 00"'
    }
  },
  {
    id: 'm26',
    name: 'Messier 26',
    type: 'messier',
    catalogIds: ['M26', 'NGC 6694'],
    commonNames: ['Messier 26'],
    category: 'star cluster',
    constellation: 'Scutum',
    coordinates: {
      ra: '18h 45m 18.0s',
      dec: '-09° 23\' 00"'
    }
  },
  {
    id: 'm28',
    name: 'Messier 28',
    type: 'messier',
    catalogIds: ['M28', 'NGC 6626'],
    commonNames: ['Messier 28'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 24m 32.89s',
      dec: '-24° 52\' 11.4"'
    }
  },
  {
    id: 'm29',
    name: 'Messier 29',
    type: 'messier',
    catalogIds: ['M29', 'NGC 6913'],
    commonNames: ['Cooling Tower Cluster'],
    category: 'star cluster',
    constellation: 'Cygnus',
    coordinates: {
      ra: '20h 23m 56.0s',
      dec: '+38° 31\' 24"'
    }
  },
  {
    id: 'm30',
    name: 'Messier 30',
    type: 'messier',
    catalogIds: ['M30', 'NGC 7099'],
    commonNames: ['Messier 30'],
    category: 'star cluster',
    constellation: 'Capricornus',
    coordinates: {
      ra: '21h 40m 22.12s',
      dec: '-23° 10\' 47.5"'
    }
  },
  {
    id: 'm32',
    name: 'Messier 32',
    type: 'messier',
    catalogIds: ['M32', 'NGC 221'],
    commonNames: ['Messier 32'],
    category: 'galaxy',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 42m 41.8s',
      dec: '+40° 51\' 55"'
    }
  },
  {
    id: 'm34',
    name: 'Messier 34',
    type: 'messier',
    catalogIds: ['M34', 'NGC 1039'],
    commonNames: ['Messier 34'],
    category: 'star cluster',
    constellation: 'Perseus',
    coordinates: {
      ra: '02h 42m 05.0s',
      dec: '+42° 45\' 42"'
    }
  },
  {
    id: 'm35',
    name: 'Messier 35',
    type: 'messier',
    catalogIds: ['M35', 'NGC 2168'],
    commonNames: ['Messier 35'],
    category: 'star cluster',
    constellation: 'Gemini',
    coordinates: {
      ra: '06h 08m 54.0s',
      dec: '+24° 20\' 00"'
    }
  },
  {
    id: 'm36',
    name: 'Messier 36',
    type: 'messier',
    catalogIds: ['M36', 'NGC 1960'],
    commonNames: ['Pinwheel Cluster'],
    category: 'star cluster',
    constellation: 'Auriga',
    coordinates: {
      ra: '05h 36m 12.0s',
      dec: '+34° 08\' 04"'
    }
  },
  {
    id: 'm37',
    name: 'Messier 37',
    type: 'messier',
    catalogIds: ['M37', 'NGC 2099'],
    commonNames: ['Messier 37'],
    category: 'star cluster',
    constellation: 'Auriga',
    coordinates: {
      ra: '05h 52m 18.0s',
      dec: '+32° 33\' 02"'
    }
  },
  {
    id: 'm38',
    name: 'Messier 38',
    type: 'messier',
    catalogIds: ['M38', 'NGC 1912'],
    commonNames: ['Starfish Cluster'],
    category: 'star cluster',
    constellation: 'Auriga',
    coordinates: {
      ra: '05h 28m 42.0s',
      dec: '+35° 51\' 18"'
    }
  },
  {
    id: 'm39',
    name: 'Messier 39',
    type: 'messier',
    catalogIds: ['M39', 'NGC 7092'],
    commonNames: ['Messier 39'],
    category: 'star cluster',
    constellation: 'Cygnus',
    coordinates: {
      ra: '21h 32m 12.0s',
      dec: '+48° 26\' 00"'
    }
  },
  {
    id: 'm40',
    name: 'Messier 40',
    type: 'messier',
    catalogIds: ['M40', 'Winnecke 4'],
    commonNames: ['Messier 40'],
    category: 'binary star',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '12h 22m 12.5s',
      dec: '+58° 04\' 59"'
    }
  },
  {
    id: 'm41',
    name: 'Messier 41',
    type: 'messier',
    catalogIds: ['M41', 'NGC 2287'],
    commonNames: ['Little Beehive Cluster'],
    category: 'star cluster',
    constellation: 'Canis Major',
    coordinates: {
      ra: '06h 46m 00.0s',
      dec: '-20° 46\' 00"'
    }
  },
  {
    id: 'm43',
    name: 'Messier 43',
    type: 'messier',
    catalogIds: ['M43', 'NGC 1982'],
    commonNames: ['De Mairan\'s Nebula'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 35m 31.0s',
      dec: '-05° 16\' 12"'
    }
  },
  {
    id: 'm46',
    name: 'Messier 46',
    type: 'messier',
    catalogIds: ['M46', 'NGC 2437'],
    commonNames: ['Messier 46'],
    category: 'star cluster',
    constellation: 'Puppis',
    coordinates: {
      ra: '07h 41m 46.0s',
      dec: '-14° 48\' 36"'
    }
  },
  {
    id: 'm47',
    name: 'Messier 47',
    type: 'messier',
    catalogIds: ['M47', 'NGC 2422'],
    commonNames: ['Messier 47'],
    category: 'star cluster',
    constellation: 'Puppis',
    coordinates: {
      ra: '07h 36m 35.0s',
      dec: '-14° 29\' 00"'
    }
  },
  {
    id: 'm48',
    name: 'Messier 48',
    type: 'messier',
    catalogIds: ['M48', 'NGC 2548'],
    commonNames: ['Messier 48'],
    category: 'star cluster',
    constellation: 'Hydra',
    coordinates: {
      ra: '08h 13m 43.0s',
      dec: '-05° 45\' 00"'
    }
  },
  {
    id: 'm49',
    name: 'Messier 49',
    type: 'messier',
    catalogIds: ['M49', 'NGC 4472'],
    commonNames: ['Messier 49'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 29m 46.7s',
      dec: '+08° 00\' 02"'
    }
  },
  {
    id: 'm50',
    name: 'Messier 50',
    type: 'messier',
    catalogIds: ['M50', 'NGC 2323'],
    commonNames: ['Heart-Shaped Cluster'],
    category: 'star cluster',
    constellation: 'Monoceros',
    coordinates: {
      ra: '07h 03m 02.0s',
      dec: '-08° 20\' 00"'
    }
  },
  {
    id: 'm51',
    name: 'Messier 51',
    type: 'messier',
    catalogIds: ['M51', 'NGC 5194'],
    commonNames: ['Whirlpool Galaxy'],
    category: 'galaxy',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '13h 29m 52.7s',
      dec: '+47° 11\' 43"'
    }
  },
  {
    id: 'm52',
    name: 'Messier 52',
    type: 'messier',
    catalogIds: ['M52', 'NGC 7654'],
    commonNames: ['Cassiopeia Salt-and-Pepper Cluster'],
    category: 'star cluster',
    constellation: 'Cassiopeia',
    coordinates: {
      ra: '23h 24m 48.0s',
      dec: '+61° 35\' 00"'
    }
  },
  {
    id: 'm53',
    name: 'Messier 53',
    type: 'messier',
    catalogIds: ['M53', 'NGC 5024'],
    commonNames: ['Messier 53'],
    category: 'star cluster',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '13h 12m 55.25s',
      dec: '+18° 10\' 05.4"'
    }
  },
  {
    id: 'm54',
    name: 'Messier 54',
    type: 'messier',
    catalogIds: ['M54', 'NGC 6715'],
    commonNames: ['Messier 54'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 55m 03.33s',
      dec: '-30° 28\' 47.5"'
    }
  },
  {
    id: 'm55',
    name: 'Messier 55',
    type: 'messier',
    catalogIds: ['M55', 'NGC 6809'],
    commonNames: ['Summer Rose Star'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '19h 39m 59.40s',
      dec: '-30° 57\' 43.5"'
    }
  },
  {
    id: 'm56',
    name: 'Messier 56',
    type: 'messier',
    catalogIds: ['M56', 'NGC 6779'],
    commonNames: ['Messier 56'],
    category: 'star cluster',
    constellation: 'Lyra',
    coordinates: {
      ra: '19h 16m 35.50s',
      dec: '+30° 11\' 04.2"'
    }
  },
  {
    id: 'm58',
    name: 'Messier 58',
    type: 'messier',
    catalogIds: ['M58', 'NGC 4579'],
    commonNames: ['Messier 58'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 37m 43.5s',
      dec: '+11° 49\' 05"'
    }
  },
  {
    id: 'm59',
    name: 'Messier 59',
    type: 'messier',
    catalogIds: ['M59', 'NGC 4621'],
    commonNames: ['Messier 59'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 42m 02.3s',
      dec: '+11° 38\' 49"'
    }
  },
  {
    id: 'm60',
    name: 'Messier 60',
    type: 'messier',
    catalogIds: ['M60', 'NGC 4649'],
    commonNames: ['Messier 60'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 43m 39.6s',
      dec: '+11° 33\' 09"'
    }
  },
  {
    id: 'm61',
    name: 'Messier 61',
    type: 'messier',
    catalogIds: ['M61', 'NGC 4303'],
    commonNames: ['Swelling Spiral'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 21m 54.9s',
      dec: '+04° 28\' 25"'
    }
  },
  {
    id: 'm62',
    name: 'Messier 62',
    type: 'messier',
    catalogIds: ['M62', 'NGC 6266'],
    commonNames: ['Flickering Globular'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '17h 01m 12.60s',
      dec: '-30° 06\' 44.5"'
    }
  },
  {
    id: 'm63',
    name: 'Messier 63',
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
    id: 'm64',
    name: 'Messier 64',
    type: 'messier',
    catalogIds: ['M64', 'NGC 4826'],
    commonNames: ['Black Eye Galaxy'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 56m 43.7s',
      dec: '+21° 40\' 58"'
    }
  },
  {
    id: 'm65',
    name: 'Messier 65',
    type: 'messier',
    catalogIds: ['M65', 'NGC 3623'],
    commonNames: ['Messier 65'],
    category: 'galaxy',
    constellation: 'Leo',
    coordinates: {
      ra: '11h 18m 55.9s',
      dec: '+13° 05\' 32"'
    }
  },
  {
    id: 'm66',
    name: 'Messier 66',
    type: 'messier',
    catalogIds: ['M66', 'NGC 3627'],
    commonNames: ['Messier 66'],
    category: 'galaxy',
    constellation: 'Leo',
    coordinates: {
      ra: '11h 20m 15.0s',
      dec: '+12° 59\' 29"'
    }
  },
  {
    id: 'm67',
    name: 'Messier 67',
    type: 'messier',
    catalogIds: ['M67', 'NGC 2682'],
    commonNames: ['King Cobra Cluster'],
    category: 'star cluster',
    constellation: 'Cancer',
    coordinates: {
      ra: '08h 51m 18.0s',
      dec: '+11° 48\' 00"'
    }
  },
  {
    id: 'm68',
    name: 'Messier 68',
    type: 'messier',
    catalogIds: ['M68', 'NGC 4590'],
    commonNames: ['Messier 68'],
    category: 'star cluster',
    constellation: 'Hydra',
    coordinates: {
      ra: '12h 39m 27.98s',
      dec: '-26° 44\' 38.6"'
    }
  },
  {
    id: 'm69',
    name: 'Messier 69',
    type: 'messier',
    catalogIds: ['M69', 'NGC 6637'],
    commonNames: ['Messier 69'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 31m 23.10s',
      dec: '-32° 20\' 53.1"'
    }
  },
  {
    id: 'm70',
    name: 'Messier 70',
    type: 'messier',
    catalogIds: ['M70', 'NGC 6681'],
    commonNames: ['Messier 70'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '18h 43m 12.76s',
      dec: '-32° 17\' 31.5"'
    }
  },
  {
    id: 'm71',
    name: 'Messier 71',
    type: 'messier',
    catalogIds: ['M71', 'NGC 6838'],
    commonNames: ['Messier 71'],
    category: 'star cluster',
    constellation: 'Sagitta',
    coordinates: {
      ra: '19h 53m 46.49s',
      dec: '+18° 46\' 45.1"'
    }
  },
  {
    id: 'm72',
    name: 'Messier 72',
    type: 'messier',
    catalogIds: ['M72', 'NGC 6981'],
    commonNames: ['Messier 72'],
    category: 'star cluster',
    constellation: 'Aquarius',
    coordinates: {
      ra: '20h 53m 27.91s',
      dec: '-12° 32\' 13.4"'
    }
  },
  {
    id: 'm73',
    name: 'Messier 73',
    type: 'messier',
    catalogIds: ['M73', 'NGC 6994'],
    commonNames: ['Messier 73'],
    category: 'star cluster',
    constellation: 'Aquarius',
    coordinates: {
      ra: '20h 58m 54.0s',
      dec: '-12° 38\' 00"'
    }
  },
  {
    id: 'm74',
    name: 'Messier 74',
    type: 'messier',
    catalogIds: ['M74', 'NGC 628'],
    commonNames: ['Phantom Galaxy'],
    category: 'galaxy',
    constellation: 'Pisces',
    coordinates: {
      ra: '01h 36m 41.8s',
      dec: '+15° 47\' 00"'
    }
  },
  {
    id: 'm75',
    name: 'Messier 75',
    type: 'messier',
    catalogIds: ['M75', 'NGC 6864'],
    commonNames: ['Messier 75'],
    category: 'star cluster',
    constellation: 'Sagittarius',
    coordinates: {
      ra: '20h 06m 04.75s',
      dec: '-21° 55\' 16.2"'
    }
  },
  {
    id: 'm76',
    name: 'Messier 76',
    type: 'messier',
    catalogIds: ['M76', 'NGC 650'],
    commonNames: ['Little Dumbbell Nebula'],
    category: 'nebula',
    constellation: 'Perseus',
    coordinates: {
      ra: '01h 42m 19.7s',
      dec: '+51° 34\' 31"'
    }
  },
  {
    id: 'm77',
    name: 'Messier 77',
    type: 'messier',
    catalogIds: ['M77', 'NGC 1068'],
    commonNames: ['Cetus A'],
    category: 'galaxy',
    constellation: 'Cetus',
    coordinates: {
      ra: '02h 42m 40.7s',
      dec: '-00° 00\' 48"'
    }
  },
  {
    id: 'm78',
    name: 'Messier 78',
    type: 'messier',
    catalogIds: ['M78', 'NGC 2068'],
    commonNames: ['Messier 78'],
    category: 'nebula',
    constellation: 'Orion',
    coordinates: {
      ra: '05h 46m 45.8s',
      dec: '+00° 04\' 45"'
    }
  },
  {
    id: 'm79',
    name: 'Messier 79',
    type: 'messier',
    catalogIds: ['M79', 'NGC 1904'],
    commonNames: ['Messier 79'],
    category: 'star cluster',
    constellation: 'Lepus',
    coordinates: {
      ra: '05h 24m 10.59s',
      dec: '-24° 31\' 27.3"'
    }
  },
  {
    id: 'm80',
    name: 'Messier 80',
    type: 'messier',
    catalogIds: ['M80', 'NGC 6093'],
    commonNames: ['Messier 80'],
    category: 'star cluster',
    constellation: 'Scorpius',
    coordinates: {
      ra: '16h 17m 02.41s',
      dec: '-22° 58\' 33.9"'
    }
  },
  {
    id: 'm81',
    name: 'Messier 81',
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
    id: 'm82',
    name: 'Messier 82',
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
    id: 'm83',
    name: 'Messier 83',
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
    id: 'm84',
    name: 'Messier 84',
    type: 'messier',
    catalogIds: ['M84', 'NGC 4374'],
    commonNames: ['Messier 84'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 25m 03.7s',
      dec: '+12° 53\' 13"'
    }
  },
  {
    id: 'm85',
    name: 'Messier 85',
    type: 'messier',
    catalogIds: ['M85', 'NGC 4382'],
    commonNames: ['Messier 85'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 25m 24.0s',
      dec: '+18° 11\' 28"'
    }
  },
  {
    id: 'm86',
    name: 'Messier 86',
    type: 'messier',
    catalogIds: ['M86', 'NGC 4406'],
    commonNames: ['Messier 86'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 26m 11.7s',
      dec: '+12° 56\' 46"'
    }
  },
  {
    id: 'm87',
    name: 'Messier 87',
    type: 'messier',
    catalogIds: ['M87', 'NGC 4486'],
    commonNames: ['Virgo A'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 30m 49.4s',
      dec: '+12° 23\' 28"'
    }
  },
  {
    id: 'm88',
    name: 'Messier 88',
    type: 'messier',
    catalogIds: ['M88', 'NGC 4501'],
    commonNames: ['Messier 88'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 31m 59.2s',
      dec: '+14° 25\' 14"'
    }
  },
  {
    id: 'm89',
    name: 'Messier 89',
    type: 'messier',
    catalogIds: ['M89', 'NGC 4552'],
    commonNames: ['Messier 89'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 35m 39.8s',
      dec: '+12° 33\' 23"'
    }
  },
  {
    id: 'm90',
    name: 'Messier 90',
    type: 'messier',
    catalogIds: ['M90', 'NGC 4569'],
    commonNames: ['Messier 90'],
    category: 'galaxy',
    constellation: 'Virgo',
    coordinates: {
      ra: '12h 36m 49.8s',
      dec: '+13° 09\' 46"'
    }
  },
  {
    id: 'm91',
    name: 'Messier 91',
    type: 'messier',
    catalogIds: ['M91', 'NGC 4548'],
    commonNames: ['Messier 91'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 35m 26.4s',
      dec: '+14° 29\' 47"'
    }
  },
  {
    id: 'm92',
    name: 'Messier 92',
    type: 'messier',
    catalogIds: ['M92', 'NGC 6341'],
    commonNames: ['Messier 92'],
    category: 'star cluster',
    constellation: 'Hercules',
    coordinates: {
      ra: '17h 17m 07.39s',
      dec: '+43° 08\' 09.4"'
    }
  },
  {
    id: 'm93',
    name: 'Messier 93',
    type: 'messier',
    catalogIds: ['M93', 'NGC 2447'],
    commonNames: ['Butterfly Cluster'],
    category: 'star cluster',
    constellation: 'Puppis',
    coordinates: {
      ra: '07h 44m 29.0s',
      dec: '-23° 51\' 11"'
    }
  },
  {
    id: 'm94',
    name: 'Messier 94',
    type: 'messier',
    catalogIds: ['M94', 'NGC 4736'],
    commonNames: ['Cat\'s Eye Galaxy'],
    category: 'galaxy',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '12h 50m 53.1s',
      dec: '+41° 07\' 14"'
    }
  },
  {
    id: 'm95',
    name: 'Messier 95',
    type: 'messier',
    catalogIds: ['M95', 'NGC 3351'],
    commonNames: ['Messier 95'],
    category: 'galaxy',
    constellation: 'Leo',
    coordinates: {
      ra: '10h 43m 57.7s',
      dec: '+11° 42\' 14"'
    }
  },
  {
    id: 'm96',
    name: 'Messier 96',
    type: 'messier',
    catalogIds: ['M96', 'NGC 3368'],
    commonNames: ['Messier 96'],
    category: 'galaxy',
    constellation: 'Leo',
    coordinates: {
      ra: '10h 46m 45.7s',
      dec: '+11° 49\' 12"'
    }
  },
  {
    id: 'm98',
    name: 'Messier 98',
    type: 'messier',
    catalogIds: ['M98', 'NGC 4192'],
    commonNames: ['Messier 98'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 13m 48.3s',
      dec: '+14° 54\' 01"'
    }
  },
  {
    id: 'm99',
    name: 'Messier 99',
    type: 'messier',
    catalogIds: ['M99', 'NGC 4254'],
    commonNames: ['Coma Pinwheel'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 18m 49.6s',
      dec: '+14° 24\' 59"'
    }
  },
  {
    id: 'm100',
    name: 'Messier 100',
    type: 'messier',
    catalogIds: ['M100', 'NGC 4321'],
    commonNames: ['Messier 100'],
    category: 'galaxy',
    constellation: 'Coma Berenices',
    coordinates: {
      ra: '12h 22m 54.9s',
      dec: '+15° 49\' 21"'
    }
  },
  {
    id: 'm101',
    name: 'Messier 101',
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
    id: 'm102',
    name: 'Messier 102',
    type: 'messier',
    catalogIds: ['M102', 'NGC 5866'],
    commonNames: ['Spindle Galaxy'],
    category: 'galaxy',
    constellation: 'Draco',
    coordinates: {
      ra: '15h 06m 29.5s',
      dec: '+55° 45\' 48"'
    }
  },
  {
    id: 'm103',
    name: 'Messier 103',
    type: 'messier',
    catalogIds: ['M103', 'NGC 581'],
    commonNames: ['Messier 103'],
    category: 'star cluster',
    constellation: 'Cassiopeia',
    coordinates: {
      ra: '01h 33m 21.0s',
      dec: '+60° 39\' 00"'
    }
  },
  {
    id: 'm104',
    name: 'Messier 104',
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
    id: 'm105',
    name: 'Messier 105',
    type: 'messier',
    catalogIds: ['M105', 'NGC 3379'],
    commonNames: ['Messier 105'],
    category: 'galaxy',
    constellation: 'Leo',
    coordinates: {
      ra: '10h 47m 49.6s',
      dec: '+12° 34\' 54"'
    }
  },
  {
    id: 'm106',
    name: 'Messier 106',
    type: 'messier',
    catalogIds: ['M106', 'NGC 4258'],
    commonNames: ['Messier 106'],
    category: 'galaxy',
    constellation: 'Canes Venatici',
    coordinates: {
      ra: '12h 18m 57.5s',
      dec: '+47° 18\' 14"'
    }
  },
  {
    id: 'm107',
    name: 'Messier 107',
    type: 'messier',
    catalogIds: ['M107', 'NGC 6171'],
    commonNames: ['Messier 107'],
    category: 'star cluster',
    constellation: 'Ophiuchus',
    coordinates: {
      ra: '16h 32m 31.91s',
      dec: '-13° 03\' 13.1"'
    }
  },
  {
    id: 'm108',
    name: 'Messier 108',
    type: 'messier',
    catalogIds: ['M108', 'NGC 3556'],
    commonNames: ['Silver Dollar Galaxy'],
    category: 'galaxy',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '11h 11m 31.0s',
      dec: '+55° 40\' 27"'
    }
  },
  {
    id: 'm109',
    name: 'Messier 109',
    type: 'messier',
    catalogIds: ['M109', 'NGC 3992'],
    commonNames: ['Messier 109'],
    category: 'galaxy',
    constellation: 'Ursa Major',
    coordinates: {
      ra: '11h 57m 36.0s',
      dec: '+53° 22\' 28"'
    }
  },
  {
    id: 'm110',
    name: 'Messier 110',
    type: 'messier',
    catalogIds: ['M110', 'NGC 205'],
    commonNames: ['Messier 110'],
    category: 'galaxy',
    constellation: 'Andromeda',
    coordinates: {
      ra: '00h 40m 22.1s',
      dec: '+41° 41\' 07"'
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