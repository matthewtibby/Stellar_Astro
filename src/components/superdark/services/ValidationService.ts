import { DarkFileWithMetadata, ValidationResult, GroupingResult } from '../types/superdark.types';
import { REQUIRED_METADATA_FIELDS, TEMPERATURE_TOLERANCE, GAIN_TOLERANCE } from '../constants/superdarkConstants';

export class ValidationService {
  /**
   * Group frames by matching metadata (camera, binning, gain, temp)
   */
  static groupByMatchingFrames(frames: DarkFileWithMetadata[]): GroupingResult {
    // Group by camera, binning, gain, and temp (rounded to nearest int)
    const groups: Record<string, DarkFileWithMetadata[]> = {};
    
    for (const f of frames) {
      const key = [f.camera, f.binning, f.gain, Math.round(Number(f.temp))].join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    
    // Find the largest group
    let bestKey: string = '';
    let bestGroup: DarkFileWithMetadata[] = [];
    
    for (const [key, group] of Object.entries(groups)) {
      if (group.length > bestGroup.length) {
        bestGroup = group;
        bestKey = key;
      }
    }
    
    return { groups, bestKey, bestGroup };
  }

  /**
   * Validate frame compatibility for superdark creation
   */
  static validateFrameCompatibility(
    newFrame: DarkFileWithMetadata, 
    existingFrames: DarkFileWithMetadata[]
  ): ValidationResult {
    const warnings: string[] = [];
    
    // Check for required metadata fields
    const requiredFields = REQUIRED_METADATA_FIELDS;
    const missingFields = requiredFields.filter(field => 
      newFrame[field as keyof DarkFileWithMetadata] === 'Unknown' || 
      newFrame[field as keyof DarkFileWithMetadata] === undefined
    );
    
    if (missingFields.length > 0) {
      warnings.push(`Missing critical metadata: ${missingFields.join(', ')}`);
    }
    
    // If no existing frames, just check for required fields
    if (existingFrames.length === 0) {
      return { 
        isCompatible: missingFields.length === 0, 
        warnings 
      };
    }
    
    // Get the best matching group from existing frames
    const { bestGroup } = this.groupByMatchingFrames(existingFrames);
    
    if (bestGroup.length === 0) {
      return { isCompatible: true, warnings };
    }
    
    // Use the first frame from the best group as reference
    const referenceFrame = bestGroup[0];
    
    // Check camera compatibility
    if (newFrame.camera !== 'Unknown' && referenceFrame.camera !== 'Unknown') {
      if (newFrame.camera !== referenceFrame.camera) {
        warnings.push(`Camera mismatch: ${newFrame.camera} vs ${referenceFrame.camera}`);
      }
    }
    
    // Check binning compatibility
    if (newFrame.binning !== 'Unknown' && referenceFrame.binning !== 'Unknown') {
      if (newFrame.binning !== referenceFrame.binning) {
        warnings.push(`Binning mismatch: ${newFrame.binning} vs ${referenceFrame.binning}`);
      }
    }
    
    // Check gain compatibility (allow some tolerance)
    if (newFrame.gain !== 'Unknown' && referenceFrame.gain !== 'Unknown') {
      const newGain = Number(newFrame.gain);
      const refGain = Number(referenceFrame.gain);
      if (!isNaN(newGain) && !isNaN(refGain) && Math.abs(newGain - refGain) > GAIN_TOLERANCE) {
        warnings.push(`Gain mismatch: ${newGain} vs ${refGain}`);
      }
    }
    
    // Check temperature compatibility (±2°C tolerance)
    if (newFrame.temp !== 'Unknown' && referenceFrame.temp !== 'Unknown') {
      const newTemp = Number(newFrame.temp);
      const refTemp = Number(referenceFrame.temp);
      if (!isNaN(newTemp) && !isNaN(refTemp) && Math.abs(newTemp - refTemp) > TEMPERATURE_TOLERANCE) {
        warnings.push(`Temperature difference: ${Math.abs(newTemp - refTemp).toFixed(1)}°C (>${TEMPERATURE_TOLERANCE}°C tolerance)`);
      }
    }
    
    // Frame is compatible if there are no critical mismatches
    const hasCriticalMismatches = warnings.some(w => 
      w.includes('Camera mismatch') || 
      w.includes('Binning mismatch') || 
      w.includes('Gain mismatch')
    );
    
    return { 
      isCompatible: !hasCriticalMismatches && missingFields.length === 0, 
      warnings 
    };
  }
}
