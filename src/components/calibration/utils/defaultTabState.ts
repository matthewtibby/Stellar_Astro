import { MasterType } from '../types/calibration.types';
import { COSMETIC_METHODS } from '../types/calibration.types';

export const getDefaultTabState = (type: MasterType) => {
  const defaultCosmeticMethods = COSMETIC_METHODS.reduce((acc, method) => {
    acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
    return acc;
  }, {} as Record<string, { enabled: boolean; order: number }>);

  switch (type) {
    case 'dark':
      return {
        advanced: false,
        stackingMethod: 'median',
        sigmaThreshold: '3.0',
        darkScaling: false,
        darkScalingAuto: true,
        darkScalingFactor: 1.0,
        biasSubtraction: false,
        ampGlowSuppression: false,
        tempMatching: false,
        exposureMatching: false,
        cosmeticCorrection: false,
        cosmeticMethods: defaultCosmeticMethods,
        cosmeticThreshold: 0.5,
        customRejection: '',
        pixelRejectionAlgorithm: 'sigma',
        badPixelMapPath: '',
        darkOptimization: false,
        useSuperdark: false,
        superdarkPath: '',
        // Flat-specific properties (unused but needed for type consistency)
        weightParam: '',
        // New advanced cosmetic correction parameters
        badPixelSigmaThreshold: 5.0,
        patternedNoiseMethod: 'auto',
        patternedNoiseStrength: 0.5,
        gradientRemovalSize: 50,
        fourierCutoffFreq: 0.1,
        polynomialDegree: 2,
      };
    case 'flat':
      return {
        advanced: false,
        stackingMethod: 'mean',
        sigmaThreshold: '3.0',
        weightParam: '',
        cosmeticCorrection: false,
        cosmeticMethods: defaultCosmeticMethods,
        cosmeticThreshold: 0.5,
        customRejection: '',
        badPixelMapPath: '',
        // Dark-specific properties (unused but needed for type consistency)
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
        // New advanced cosmetic correction parameters
        badPixelSigmaThreshold: 5.0,
        patternedNoiseMethod: 'auto',
        patternedNoiseStrength: 0.5,
        gradientRemovalSize: 50,
        fourierCutoffFreq: 0.1,
        polynomialDegree: 2,
      };
    case 'bias':
    default:
      return {
        advanced: false,
        stackingMethod: 'median',
        sigmaThreshold: '3.0',
        cosmeticCorrection: false,
        cosmeticMethods: defaultCosmeticMethods,
        cosmeticThreshold: 0.5,
        customRejection: '',
        badPixelMapPath: '',
        // Dark-specific properties (unused but needed for type consistency)
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
        // Flat-specific properties (unused but needed for type consistency)
        weightParam: '',
        // New advanced cosmetic correction parameters
        badPixelSigmaThreshold: 5.0,
        patternedNoiseMethod: 'auto',
        patternedNoiseStrength: 0.5,
        gradientRemovalSize: 50,
        fourierCutoffFreq: 0.1,
        polynomialDegree: 2,
      };
  }
};

// Default settings for reset
export const getDefaultTabStateForAllTypes = () => ({
  dark: getDefaultTabState('dark'),
  flat: getDefaultTabState('flat'),
  bias: getDefaultTabState('bias'),
}); 