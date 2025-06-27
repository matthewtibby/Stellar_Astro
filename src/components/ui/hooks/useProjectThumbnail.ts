import { getSkyViewThumbnailUrl } from '@/src/lib/client/skyview';
import { ProjectCardProps } from '../types/projectCard.types';

export function useProjectThumbnail({
  target,
  status,
  userImageUrl,
  thumbnailUrl,
}: Pick<ProjectCardProps, 'target' | 'status' | 'userImageUrl' | 'thumbnailUrl'>) {
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
  const safeDisplayImage = displayImage || '/images/placeholder.jpg';

  return { safeDisplayImage };
} 