import { getSkyViewThumbnailUrl } from '@/src/lib/client/skyview';
import { ProjectTarget } from '../types/projectCard.types';

export function useProjectImage({ target, status, userImageUrl, thumbnailUrl }: {
  target?: ProjectTarget;
  status: string;
  userImageUrl?: string;
  thumbnailUrl: string;
}) {
  let skyviewUrl: string | undefined = undefined;
  if (target && target.coordinates && target.coordinates.ra && target.coordinates.dec) {
    let fovArcmin = 30;
    if (target.angularSizeArcmin) {
      fovArcmin = Math.max(target.angularSizeArcmin * 1.5, 15);
    } else if (target.category === 'galaxy') {
      fovArcmin = 40;
    } else if (target.category === 'nebula') {
      fovArcmin = 30;
    } else if (target.category === 'star cluster') {
      fovArcmin = 20;
    }
    skyviewUrl = getSkyViewThumbnailUrl({
      ra: target.coordinates.ra,
      dec: target.coordinates.dec,
      fovArcmin,
    });
  }
  const displayImage = skyviewUrl || (status === "completed" && userImageUrl ? userImageUrl : thumbnailUrl);
  return { displayImage };
} 