export interface EquipmentItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: 'telescope' | 'camera';
  description: string;
  specs: string[];
}

// Mock data based on First Light Optics products
export const telescopes: EquipmentItem[] = [
  {
    id: 't1',
    name: 'Sky-Watcher Evostar 72ED DS-Pro',
    price: 299,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/e/v/evostar-72ed-ds-pro-1.jpg',
    category: 'telescope',
    description: 'A high-quality 72mm ED doublet refractor telescope',
    specs: [
      '72mm aperture',
      '420mm focal length',
      'f/5.8 focal ratio',
      'ED glass for reduced chromatic aberration',
      '2" focuser with 1.25" adapter'
    ]
  },
  {
    id: 't2',
    name: 'Sky-Watcher Explorer-130PDS',
    price: 199,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/e/x/explorer-130pds-1.jpg',
    category: 'telescope',
    description: 'A versatile 130mm Newtonian reflector telescope',
    specs: [
      '130mm aperture',
      '650mm focal length',
      'f/5 focal ratio',
      'Parabolic mirror',
      'Dual-speed 2" focuser'
    ]
  },
  {
    id: 't3',
    name: 'William Optics GT81',
    price: 599,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/w/i/william-optics-gt81-1.jpg',
    category: 'telescope',
    description: 'Premium 81mm triplet apochromatic refractor',
    specs: [
      '81mm aperture',
      '382mm focal length',
      'f/4.7 focal ratio',
      'Triplet design with FPL-53 glass',
      'Rotating focuser with 2" adapter'
    ]
  }
];

export const cameras: EquipmentItem[] = [
  {
    id: 'c1',
    name: 'ZWO ASI 533MC Pro',
    price: 399,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/z/w/zwo-asi533mc-pro-1.jpg',
    category: 'camera',
    description: 'One-shot color CMOS camera for deep sky imaging',
    specs: [
      'APS-C sized sensor',
      '11.3MP resolution',
      'Cooled to -35°C below ambient',
      'USB 3.0 interface',
      'Built-in filter drawer'
    ]
  },
  {
    id: 'c2',
    name: 'ZWO ASI 2600MM Pro',
    price: 1299,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/z/w/zwo-asi2600mm-pro-1.jpg',
    category: 'camera',
    description: 'Monochrome CMOS camera for professional astrophotography',
    specs: [
      'APS-C sized sensor',
      '26MP resolution',
      'Cooled to -35°C below ambient',
      'USB 3.0 interface',
      'Built-in filter drawer',
      'Compatible with 1.25" and 2" filters'
    ]
  },
  {
    id: 'c3',
    name: 'ZWO ASI 120MM Mini',
    price: 149,
    imageUrl: 'https://www.firstlightoptics.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/z/w/zwo-asi120mm-mini-1.jpg',
    category: 'camera',
    description: 'Compact monochrome camera for planetary imaging',
    specs: [
      '1.2MP resolution',
      'USB 2.0 interface',
      'Small form factor',
      'Ideal for planetary and lunar imaging',
      'Compatible with 1.25" filters'
    ]
  }
];

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return [...telescopes, ...cameras].find(item => item.id === id);
} 