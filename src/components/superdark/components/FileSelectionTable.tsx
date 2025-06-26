import React from 'react';
import { DarkFileWithMetadata } from '../types/superdark.types';

interface FileSelectionTableProps {
  allFiles: DarkFileWithMetadata[];
  bestGroup: DarkFileWithMetadata[];
  selectedDarkPaths: string[];
  onDarkCheckbox: (path: string, checked: boolean) => void;
  onDeleteTempFile: (file: DarkFileWithMetadata) => void;
}

export const FileSelectionTable: React.FC<FileSelectionTableProps> = ({
  allFiles,
  bestGroup,
  selectedDarkPaths,
  onDarkCheckbox,
  onDeleteTempFile
}) => {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-2 text-blue-100 flex items-center gap-2 text-lg">
        Select Dark Frames ({allFiles.length} available)
        <span className="ml-1 text-xs text-blue-300 cursor-pointer" title="Frames must match on camera, binning, gain, and be within ±2°C for temperature. The largest matching group is highlighted.">
          ℹ️
        </span>
      </label>
      
      <div className="max-h-64 overflow-y-auto border border-[#232946]/60 rounded-lg bg-[#181c23]">
        <table className="w-full text-sm">
          <thead className="bg-[#0f1419] sticky top-0">
            <tr className="text-blue-100">
              <th className="p-2 text-left">Select</th>
              <th className="p-2 text-left">File</th>
              <th className="p-2 text-left">Project</th>
              <th className="p-2 text-left">Camera</th>
              <th className="p-2 text-left">Binning</th>
              <th className="p-2 text-left">Gain</th>
              <th className="p-2 text-left">Temp (°C)</th>
              <th className="p-2 text-left">Exposure</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allFiles.map((file) => {
              const isInBestGroup = bestGroup.some(bf => bf.path === file.path);
              const isSelected = selectedDarkPaths.includes(file.path);
              return (
                <tr key={file.path} className={`border-b border-[#232946]/30 ${isInBestGroup ? 'bg-green-900/20' : ''} ${isSelected ? 'bg-blue-900/20' : ''}`}>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onDarkCheckbox(file.path, e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2 text-blue-200">
                    <div className="flex items-center gap-2">
                      {file.name}
                      {file.isTemporary && <span className="text-xs bg-blue-600 px-1 rounded">TEMP</span>}
                      {isInBestGroup && <span className="text-xs bg-green-600 px-1 rounded">MATCH</span>}
                    </div>
                  </td>
                  <td className="p-2 text-blue-300">{file.project}</td>
                  <td className="p-2 text-blue-300">{file.camera}</td>
                  <td className="p-2 text-blue-300">{file.binning}</td>
                  <td className="p-2 text-blue-300">{file.gain}</td>
                  <td className="p-2 text-blue-300">{file.temp}</td>
                  <td className="p-2 text-blue-300">{file.exposure}s</td>
                  <td className="p-2">
                    {file.isTemporary && (
                      <button
                        onClick={() => onDeleteTempFile(file)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Delete temporary file"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 