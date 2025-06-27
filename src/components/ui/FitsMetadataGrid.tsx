import React from 'react';

interface FitsMetadataGridProps {
  fitsMetadata: Record<string, unknown>;
}

const standardFields: [string, string][] = [
  ['exposure_time', 'Exposure Time (s)'],
  ['gain', 'Gain'],
  ['egain', 'eGain'],
  ['temperature', 'Temperature (°C)'],
  ['binning', 'Binning'],
  ['focal_length', 'Focal Length (mm)'],
  ['offset', 'Offset'],
  ['pixel_size', 'Pixel Size (μm)'],
  ['image_type', 'Image Type'],
  ['object', 'Object'],
  ['filter', 'Filter'],
  ['date_obs', 'Date Obs'],
  ['telescope', 'Telescope'],
  ['instrument', 'Instrument'],
  ['creator', 'Creator'],
  ['observation_type', 'Observation Type'],
  ['ra', 'RA'],
  ['dec', 'Dec'],
];

const FitsMetadataGrid: React.FC<FitsMetadataGridProps> = ({ fitsMetadata }) => (
  <div className="bg-gray-900/80 rounded p-3 text-xs text-blue-100 grid grid-cols-2 gap-x-6 gap-y-1">
    {standardFields.map(([key, label]) => (
      <div key={key}><span className="text-gray-400">{label}:</span> <span className="font-mono">{fitsMetadata?.[key] != null && fitsMetadata[key] !== '' ? String(fitsMetadata[key]) : '—'}</span></div>
    ))}
    {Object.entries(fitsMetadata)
      .filter(([key]) => !standardFields.map(([k]) => k).includes(key))
      .map(([key, value]) => (
        <div key={key}><span className="text-gray-400">{key}:</span> <span className="font-mono">{value != null && value !== '' ? String(value) : '—'}</span></div>
      ))}
  </div>
);

export default FitsMetadataGrid; 