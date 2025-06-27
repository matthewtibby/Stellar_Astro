import { TabState } from '../types/calibrationState.types';
import { MasterType } from '../types/calibration.types';

/**
 * Returns the default tab state for a given master type.
 */
export function getDefaultTabState(type: MasterType): TabState {
  return {
    advanced: false,
    stackingMethod: 'average',
    sigmaThreshold: '3.0',
    cosmeticCorrection: false,
    cosmeticMethods: {},
    cosmeticThreshold: 5,
    customRejection: '',
    badPixelMapPath: '',
    // Dark-specific
    darkScaling: false,
    darkScalingAuto: true,
    darkScalingFactor: 1.0,
    biasSubtraction: false,
    ampGlowSuppression: false,
    tempMatching: false,
    exposureMatching: false,
    pixelRejectionAlgorithm: 'sigma',
    darkOptimization: false,
    useSuperdark: false,
    superdarkPath: '',
    // Flat-specific
    weightParam: '',
    // Advanced cosmetic correction parameters
    badPixelSigmaThreshold: 5,
    patternedNoiseMethod: '',
    patternedNoiseStrength: 0,
    gradientRemovalSize: 0,
    fourierCutoffFreq: 0,
    polynomialDegree: 0,
  };
} 