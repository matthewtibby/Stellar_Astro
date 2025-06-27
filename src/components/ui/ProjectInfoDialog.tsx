import React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

import { ProjectTarget, ProjectCardProps, Equipment } from './types/projectCard.types';
import FitsMetadataGrid from './FitsMetadataGrid';

interface ProjectInfoDialogProps {
  safeCreationDate: string;
  safeUpdatedAt: string;
  safeFrameCount: number;
  safeFileSize: string;
  status: ProjectCardProps['status'];
  id: string;
  target?: ProjectTarget;
  safeEquipment: Equipment[];
  getStatusLabel: (status: ProjectCardProps['status']) => string;
  getEquipmentIcon: (type: Equipment['type']) => React.ReactNode;
}

const ProjectInfoDialog: React.FC<ProjectInfoDialogProps> = ({
  safeCreationDate,
  safeUpdatedAt,
  safeFrameCount,
  safeFileSize,
  status,
  id,
  target,
  safeEquipment,
  getStatusLabel,
  getEquipmentIcon,
}) => (
  <DialogContent className="bg-gray-900 border border-gray-800 shadow-2xl">
    <DialogHeader>
      <DialogTitle>Project Information</DialogTitle>
    </DialogHeader>
    <div className="max-h-[60vh] overflow-y-auto px-1 py-2 space-y-6 text-sm text-primary-foreground">
      {/* Project Info Section */}
      <div>
        <h3 className="font-bold text-base mb-2 text-blue-300">Project Info</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div><span className="text-gray-400">Created:</span> {safeCreationDate}</div>
          <div><span className="text-gray-400">Updated:</span> {safeUpdatedAt}</div>
          <div><span className="text-gray-400">Frames:</span> {safeFrameCount}</div>
          <div><span className="text-gray-400">Size:</span> {safeFileSize}</div>
          <div><span className="text-gray-400">Status:</span> {getStatusLabel(status)}</div>
          <div><span className="text-gray-400">Project ID:</span> <span className="font-mono text-xs break-all">{id}</span></div>
        </div>
      </div>
      {/* Target Details Section */}
      {target && (
        <div>
          <h3 className="font-bold text-base mb-2 text-blue-300">Target Details</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {target.name && <div><span className="text-gray-400">Name:</span> {target.name}</div>}
            {target.catalogIds && target.catalogIds.length > 0 && <div><span className="text-gray-400">Catalog IDs:</span> {target.catalogIds.join(', ')}</div>}
            {target.constellation && <div><span className="text-gray-400">Constellation:</span> {target.constellation}</div>}
            {target.type && <div><span className="text-gray-400">Type:</span> {target.type}</div>}
            {target.category && <div><span className="text-gray-400">Category:</span> {target.category}</div>}
            {target.commonNames && target.commonNames.length > 0 && <div><span className="text-gray-400">Common Names:</span> {target.commonNames.join(', ')}</div>}
            {target.coordinates && (target.coordinates.ra || target.coordinates.dec) && (
              <div className="col-span-2"><span className="text-gray-400">Coordinates:</span> RA: {target.coordinates.ra}, Dec: {target.coordinates.dec}</div>
            )}
          </div>
        </div>
      )}
      {/* Equipment Section */}
      {safeEquipment.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2 text-blue-300">Equipment</h3>
          <div className="flex flex-wrap gap-4">
            {safeEquipment.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-800/60 rounded px-2 py-1">
                {getEquipmentIcon(item.type)}
                <span className="capitalize text-white/90">{item.type}:</span>
                <span className="font-mono text-xs text-blue-200">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* FITS Metadata Section (if available) */}
      {target && target.fitsMetadata && (
        <div>
          <h3 className="font-bold text-base mb-2 text-blue-300">FITS Metadata</h3>
          <FitsMetadataGrid fitsMetadata={target.fitsMetadata} />
        </div>
      )}
    </div>
  </DialogContent>
);

export default ProjectInfoDialog; 