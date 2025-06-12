import { validateFITSFile } from './fileValidation';

export interface FileMetadata {
  exposure?: number;
  gain?: number;
  temperature?: number;
  filter?: string;
  dateObs?: string;
}

export interface OrganizedFiles {
  light: File[];
  dark: File[];
  flat: File[];
  bias: File[];
  unknown: File[];
  metadata: {
    [key: string]: FileMetadata;
  };
}

export async function organizeFiles(files: File[], projectId: string, userId: string): Promise<OrganizedFiles> {
  const organized: OrganizedFiles = {
    light: [],
    dark: [],
    flat: [],
    bias: [],
    unknown: [],
    metadata: {}
  };

  // Validate all files first
  const validationResults = await Promise.all(
    files.map(file => validateFITSFile(file, projectId, userId))
  );

  // Organize files based on validation results
  files.forEach((file, index) => {
    const validation = validationResults[index];
    const frameType = validation.metadata?.frameType;

    // Add file to appropriate category
    if (frameType && typeof frameType === 'string' && frameType in organized) {
      (organized[frameType as keyof Omit<OrganizedFiles, 'metadata'>] as File[]).push(file);
    } else {
      organized.unknown.push(file);
    }

    // Store metadata, with type guards
    const meta = validation.metadata || {};
    organized.metadata[file.name] = {
      exposure: typeof meta.exposureTime === 'number' ? meta.exposureTime : undefined,
      gain: typeof meta.gain === 'number' ? meta.gain : undefined,
      temperature: typeof meta.temperature === 'number' ? meta.temperature : undefined,
      filter: typeof meta.filter === 'string' ? meta.filter : undefined,
      dateObs: typeof meta.observationDate === 'string' ? meta.observationDate : undefined,
    };
  });

  return organized;
}

export function groupFilesByMetadata(files: OrganizedFiles): {
  [key: string]: {
    files: File[];
    metadata: FileMetadata;
  };
} {
  const groups: {
    [key: string]: {
      files: File[];
      metadata: FileMetadata;
    };
  } = {};

  // Group light frames by exposure, gain, and temperature
  files.light.forEach(file => {
    const metadata = files.metadata[file.name];
    const key = `${metadata.exposure}_${metadata.gain}_${metadata.temperature}_${metadata.filter}`;
    
    if (!groups[key]) {
      groups[key] = {
        files: [],
        metadata
      };
    }
    groups[key].files.push(file);
  });

  return groups;
}

export function validateFileGroups(groups: ReturnType<typeof groupFilesByMetadata>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // Check if we have enough frames for each group
  Object.entries(groups).forEach(([key, group]) => {
    if (group.files.length < 5) {
      result.warnings.push(`Group ${key} has fewer than 5 light frames`);
    }
  });

  // Check for matching dark frames
  Object.entries(groups).forEach(([key, group]) => {
    const { exposure, gain, temperature } = group.metadata;
    const matchingDarks = group.files.filter(() => {
      const metadata = groups[key].metadata;
      return metadata.exposure === exposure && 
             metadata.gain === gain && 
             metadata.temperature === temperature;
    });

    if (matchingDarks.length < 5) {
      result.warnings.push(`Group ${key} has fewer than 5 matching dark frames`);
    }
  });

  return result;
} 