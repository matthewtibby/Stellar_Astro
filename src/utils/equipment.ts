export interface EquipmentItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: 'telescope' | 'camera';
  description: string;
  specs: Record<string, string>;
}

// Mock data based on First Light Optics products
export const telescopes: EquipmentItem[] = [
  {
    id: 'telescope-1',
    name: 'William Optics GT81',
    price: 1199.00,
    imageUrl: 'https://placehold.co/600x400.png?text=William+Optics+GT81',
    category: 'telescope',
    description: 'A versatile 81mm f/5.9 apochromatic refractor perfect for both visual and photographic use.',
    specs: {
      'Aperture': '81mm',
      'Focal Length': '478mm',
      'Focal Ratio': 'f/5.9',
      'Weight': '3.2kg'
    }
  },
  {
    id: 'telescope-2',
    name: 'Sky-Watcher Esprit 100ED',
    price: 2499.00,
    imageUrl: 'https://placehold.co/600x400.png?text=Sky-Watcher+Esprit+100ED',
    category: 'telescope',
    description: 'Professional-grade 100mm f/5.5 triplet apochromatic refractor with exceptional color correction.',
    specs: {
      'Aperture': '100mm',
      'Focal Length': '550mm',
      'Focal Ratio': 'f/5.5',
      'Weight': '5kg'
    }
  },
  {
    id: 'telescope-3',
    name: 'Celestron EdgeHD 8',
    price: 1999.00,
    imageUrl: 'https://placehold.co/600x400.png?text=Celestron+EdgeHD+8',
    category: 'telescope',
    description: '8-inch Schmidt-Cassegrain telescope with EdgeHD optics for superior edge correction.',
    specs: {
      'Aperture': '203.2mm',
      'Focal Length': '2032mm',
      'Focal Ratio': 'f/10',
      'Weight': '6.8kg'
    }
  }
];

export const cameras: EquipmentItem[] = [
  {
    id: 'camera-1',
    name: 'ZWO ASI533MC Pro',
    price: 999.00,
    imageUrl: 'https://placehold.co/600x400.png?text=ZWO+ASI533MC+Pro',
    category: 'camera',
    description: 'One-shot color astronomy camera with excellent cooling and low noise performance.',
    specs: {
      'Sensor': 'Sony IMX533',
      'Resolution': '9MP',
      'Pixel Size': '3.76µm',
      'Cooling': '-35°C below ambient'
    }
  },
  {
    id: 'camera-2',
    name: 'QHY268M',
    price: 2499.00,
    imageUrl: 'https://placehold.co/600x400.png?text=QHY268M',
    category: 'camera',
    description: 'Professional monochrome astronomy camera with back-illuminated sensor.',
    specs: {
      'Sensor': 'Sony IMX571',
      'Resolution': '26MP',
      'Pixel Size': '3.76µm',
      'Cooling': '-40°C below ambient'
    }
  },
  {
    id: 'camera-3',
    name: 'ZWO ASI2600MM Pro',
    price: 3299.00,
    imageUrl: 'https://placehold.co/600x400.png?text=ZWO+ASI2600MM+Pro',
    category: 'camera',
    description: 'High-end monochrome camera with large sensor and excellent cooling.',
    specs: {
      'Sensor': 'Sony IMX571',
      'Resolution': '26MP',
      'Pixel Size': '3.76µm',
      'Cooling': '-45°C below ambient'
    }
  }
];

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return [...telescopes, ...cameras].find(item => item.id === id);
} 