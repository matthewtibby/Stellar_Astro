import { AstronomicalTarget } from '@/src/data/astronomicalTargets';
import { Telescope, Camera, Filter } from '@/src/data/equipmentDatabase';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  target: AstronomicalTarget;
  recommendedEquipment: {
    telescope: Telescope;
    camera: Camera;
    filters: Filter[];
  };
  recommendedSettings: {
    exposure: number;
    gain: number;
    temperature: number;
  };
  workflowSteps: string[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'deep-sky',
    name: 'Deep Sky Object',
    description: 'Template for capturing deep sky objects like galaxies and nebulae',
    target: {
      id: 'M31',
      name: 'Andromeda Galaxy',
      catalogIds: ['M31', 'NGC 224'],
      constellation: 'Andromeda',
      category: 'galaxy',
      type: 'messier',
      commonNames: ['Great Andromeda Nebula'],
      coordinates: {
        ra: '00h 42m 44.3s',
        dec: '+41° 16\' 09"'
      }
    },
    recommendedEquipment: {
      telescope: {
        id: '1',
        brand: 'Celestron',
        model: 'EdgeHD 8"',
        aperture: 203.2,
        focalLength: 2032,
        mount: 'equatorial',
        type: 'catadioptric',
        description: '8-inch Schmidt-Cassegrain telescope'
      },
      camera: {
        id: '1',
        brand: 'ZWO',
        model: 'ASI 2600MM Pro',
        sensor: 'APS-C',
        sensorSize: '23.5x15.7',
        resolution: '6248x4176',
        pixelSize: 3.76,
        cooling: true,
        description: 'Monochrome cooled CMOS camera'
      },
      filters: [
        {
          id: '1',
          brand: 'Astronomik',
          model: 'LRGB Set',
          type: 'color',
          size: 2,
          price: 0.0,
          description: 'LRGB filter set for color imaging'
        }
      ]
    },
    recommendedSettings: {
      exposure: 300,
      gain: 100,
      temperature: -10
    },
    workflowSteps: [
      'Capture light frames',
      'Capture dark frames',
      'Capture flat frames',
      'Capture bias frames',
      'Calibrate frames',
      'Register frames',
      'Stack frames',
      'Post-process'
    ]
  },
  {
    id: 'planetary',
    name: 'Planetary',
    description: 'Template for capturing planets and the Moon',
    target: {
      id: 'JUPITER',
      name: 'Jupiter',
      catalogIds: [],
      constellation: 'N/A',
      category: 'other',
      type: 'other',
      commonNames: ['Jupiter'],
      coordinates: {
        ra: 'N/A',
        dec: 'N/A'
      }
    },
    recommendedEquipment: {
      telescope: {
        id: '2',
        brand: 'Celestron',
        model: 'C11',
        aperture: 279.4,
        focalLength: 2800,
        mount: 'equatorial',
        type: 'catadioptric',
        description: '11-inch Schmidt-Cassegrain telescope'
      },
      camera: {
        id: '2',
        brand: 'ZWO',
        model: 'ASI 224MC',
        sensor: '1/3"',
        sensorSize: '4.8x3.6',
        resolution: '1304x976',
        pixelSize: 3.75,
        cooling: true,
        description: 'Color planetary camera'
      },
      filters: [
        {
          id: '2',
          brand: 'ZWO',
          model: 'RGB Set',
          type: 'color',
          size: 1.25,
          price: 0.0,
          description: 'RGB filter set for planetary imaging'
        }
      ]
    },
    recommendedSettings: {
      exposure: 0.01,
      gain: 300,
      temperature: -10
    },
    workflowSteps: [
      'Capture video sequence',
      'Extract frames',
      'Select best frames',
      'Stack frames',
      'Post-process'
    ]
  }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  return projectTemplates.filter(template => template.target.category === category);
} 