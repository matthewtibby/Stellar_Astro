import React from 'react';
import { CompatibilityWarnings } from '../types/superdark.types';

interface CombinedWarningsDisplayProps {
  compatibilityWarnings: CompatibilityWarnings;
  superdarkWarnings: string[];
}

export const CombinedWarningsDisplay: React.FC<CombinedWarningsDisplayProps> = ({
  compatibilityWarnings,
  superdarkWarnings
}) => {
  const hasCompatibilityWarnings = Object.keys(compatibilityWarnings).length > 0;
  const hasSuperdarkWarnings = superdarkWarnings.length > 0;

  if (!hasCompatibilityWarnings && !hasSuperdarkWarnings) {
    return null;
  }

  return (
    <>
      {/* Compatibility warnings */}
      {hasCompatibilityWarnings && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <h4 className="text-yellow-400 font-medium mb-2">Compatibility Warnings:</h4>
          {Object.entries(compatibilityWarnings).map(([fileName, warnings]) => (
            <div key={fileName} className="mb-2">
              <span className="text-yellow-300 font-medium">{fileName}:</span>
              <ul className="ml-4 text-sm text-yellow-200">
                {(warnings as string[]).map((warning: string, idx: number) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Superdark warnings */}
      {hasSuperdarkWarnings && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
          <h4 className="text-red-400 font-medium mb-2">Warnings:</h4>
          <ul className="text-sm text-red-200">
            {superdarkWarnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}; 