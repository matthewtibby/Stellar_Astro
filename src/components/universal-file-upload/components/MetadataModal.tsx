import React from 'react';
import { X } from 'lucide-react';
import type { StorageFileWithMetadata } from '../types/upload.types';

interface MetadataModalProps {
  metadataModalFile: StorageFileWithMetadata | null;
  setMetadataModalFile: (file: StorageFileWithMetadata | null) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({ metadataModalFile, setMetadataModalFile }) => (
  metadataModalFile ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#181c23] rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border border-blue-500/40">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
          onClick={() => setMetadataModalFile(null)}
          aria-label="Close metadata modal"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-white mb-4">File Metadata</h2>
        <div className="mb-2 text-blue-200 font-mono text-xs break-all">{metadataModalFile.name}</div>
        {/* Astrophotography-relevant fields */}
        {(() => {
          const meta = metadataModalFile.metadata || {};
          const astroFields = [
            { key: 'camera', label: 'Camera' },
            { key: 'telescope', label: 'Telescope' },
            { key: 'exposure', label: 'Exposure (s)' },
            { key: 'exposure_time', label: 'Exposure (s)' },
            { key: 'binning', label: 'Binning' },
            { key: 'filter', label: 'Filter' },
            { key: 'gain', label: 'Gain' },
            { key: 'iso', label: 'ISO' },
            { key: 'temperature', label: 'Temperature (°C)' },
            { key: 'date', label: 'Date' },
            { key: 'object', label: 'Object' },
            { key: 'observer', label: 'Observer' },
            { key: 'site', label: 'Site' },
            { key: 'focal_length', label: 'Focal Length (mm)' },
            { key: 'pixel_size', label: 'Pixel Size (μm)' },
            { key: 'aperture', label: 'Aperture (mm)' },
            { key: 'ra', label: 'RA' },
            { key: 'dec', label: 'DEC' },
            { key: 'image_type', label: 'Image Type' },
            { key: 'observation_type', label: 'Observation Type' },
          ];
          const shownKeys = new Set();
          const rows = astroFields
            .map(({ key, label }) => meta[key] !== undefined && meta[key] !== '' ? (
              shownKeys.add(key),
              <tr key={key}>
                <td className="font-semibold pr-2 text-blue-300 text-right align-top whitespace-nowrap">{label}</td>
                <td className="pl-2 text-blue-100 break-all">{String(meta[key])}</td>
              </tr>
            ) : null)
            .filter(Boolean);
          return rows.length > 0 ? (
            <table className="w-full text-xs text-blue-100 mb-4">
              <tbody>{rows}</tbody>
            </table>
          ) : null;
        })()}
        {/* Other metadata */}
        {(() => {
          const meta = metadataModalFile.metadata || {};
          const astroKeys = [
            'camera','telescope','exposure','exposure_time','binning','filter','gain','iso','temperature','date','object','observer','site','focal_length','pixel_size','aperture','ra','dec','image_type','observation_type'
          ];
          const otherEntries = Object.entries(meta).filter(([key]) => !astroKeys.includes(key) && meta[key] !== undefined && meta[key] !== '');
          return otherEntries.length > 0 ? (
            <>
              <div className="text-blue-300 font-semibold mt-2 mb-1 text-xs">Other Metadata</div>
              <table className="w-full text-xs text-blue-100">
                <tbody>
                  {otherEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td className="font-semibold pr-2 text-blue-300 text-right align-top whitespace-nowrap">{key}</td>
                      <td className="pl-2 text-blue-100 break-all">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null;
        })()}
      </div>
    </div>
  ) : null
); 