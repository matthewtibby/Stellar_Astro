import { ProjectCardProps, Equipment } from '../types/projectCard.types';
import { formatDate } from './projectCardUtils';

export function getProjectCardFallbacks(props: ProjectCardProps) {
  const {
    targetName,
    title,
    name,
    frameCount,
    fileSize,
    creationDate,
    updatedAt,
    equipment,
    thumbnailUrl,
    status,
    userImageUrl,
    target,
  } = props;
  const dataFallbacks: string[] = [];
  const safeTargetName = targetName || title || name || '—';
  if (!targetName && !title && !name) dataFallbacks.push('targetName');
  const safeFrameCount = typeof frameCount === 'number' ? frameCount : 0;
  if (typeof frameCount !== 'number') dataFallbacks.push('frameCount');
  const safeFileSize = fileSize || '—';
  if (!fileSize) dataFallbacks.push('fileSize');
  const safeCreationDate = formatDate(creationDate);
  if (!creationDate) dataFallbacks.push('creationDate');
  const safeUpdatedAt = formatDate(updatedAt);
  if (!updatedAt) dataFallbacks.push('updatedAt');
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  if (!Array.isArray(equipment) || equipment.length === 0) dataFallbacks.push('equipment');
  // displayImage fallback is handled in useProjectImage
  return {
    safeTargetName,
    safeFrameCount,
    safeFileSize,
    safeCreationDate,
    safeUpdatedAt,
    safeEquipment,
    dataFallbacks,
  };
} 