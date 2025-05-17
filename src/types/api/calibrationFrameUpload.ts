export type CalibrationFrameType = 'light' | 'dark' | 'flat' | 'bias';

export interface CalibrationFrameUploadRequest {
  frameType: CalibrationFrameType;
  metadata: Record<string, string | number | boolean>;
  tags?: string[];
  version?: string | number;
  notes?: string;
  // file: File; // Handled by multipart/form-data, not in interface
}

export interface CalibrationFrameResponse {
  id: string;
  projectId: string;
  userId: string;
  frameType: CalibrationFrameType;
  fileUrl: string;
  fileSize: number;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  tags?: string[];
  version?: string | number;
  notes?: string;
  archived: boolean;
} 