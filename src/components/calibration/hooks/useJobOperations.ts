import { useState, useEffect } from 'react';
import { MasterType } from '../types/calibration.types';
import { calibrationJobService } from '../../../services/calibration';

export function useJobOperations(projectId: string) {
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'running' | 'success' | 'failed'>('idle');
  const [jobProgress, setJobProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [calibrationStart, setCalibrationStart] = useState<number | null>(null);
  const [calibrationEnd, setCalibrationEnd] = useState<number | null>(null);
  const [qualityAnalysisResults, setQualityAnalysisResults] = useState<any>(null);

  // Poll job progress when running/queued
  useEffect(() => {
    if ((jobStatus === 'queued' || jobStatus === 'running') && jobId) {
      const interval = setInterval(async () => {
        try {
          const data = await calibrationJobService.pollJobProgress(projectId, jobId);
          
          if (typeof data.progress === 'number') {
            setJobProgress(data.progress);
          }
          
          if (data.status === 'running' && jobStatus !== 'running') {
            setJobStatus('running');
          }
          
          if (data.status === 'success' || data.status === 'complete') {
            setJobStatus('success');
            setJobProgress(100);
            setCalibrationEnd(Date.now());
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
            clearInterval(interval);
          }
          
          if (data.status === 'failed') {
            setJobStatus('failed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error('[Polling] Error fetching progress:', e);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    } else {
      setJobProgress(0);
    }
  }, [jobStatus, jobId, projectId]);

  // Fetch job results when job succeeds
  useEffect(() => {
    if (jobStatus === 'success' && jobId) {
      let isMounted = true;
      
      const fetchResults = async () => {
        try {
          const data = await calibrationJobService.getJobResults(projectId, jobId);
          
          if (data.status === 202) {
            setTimeout(fetchResults, 2000);
            return;
          }
          
          if (isMounted && data.results) {
            // Extract quality analysis results
            if (data.diagnostics && data.diagnostics.quality_analysis) {
              setQualityAnalysisResults(data.diagnostics.quality_analysis);
            }

            // Send notification for used/rejected frames
            if (typeof data.results.used === 'number' || typeof data.results.rejected === 'number') {
              let message = `Calibration complete: ${data.results.used ?? 0} frames used.`;
              if (data.results.rejected > 0) {
                message += ` ${data.results.rejected} frame(s) rejected.`;
                if (Array.isArray(data.results.rejected_details) && data.results.rejected_details.length > 0) {
                  message += '\nReasons:';
                  for (const rej of data.results.rejected_details) {
                    message += `\n- ${rej.file}: ${rej.reason}`;
                  }
                }
              }
              
              // Send notification to bell
              fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: data.results.rejected > 0 ? 'warning' : 'success',
                  eventType: 'processing_step',
                  message,
                  data: data.results,
                }),
              });
            }
          }
        } catch (error) {
          console.error('[Results] Error fetching results:', error);
        }
      };
      
      fetchResults();
      return () => { isMounted = false; };
    }
  }, [jobStatus, jobId, projectId]);

  // Submit calibration job
  const submitJob = async (settings: any) => {
    setCalibrationStart(Date.now());
    setCalibrationEnd(null);
    setJobProgress(0);
    setJobStatus('queued');
    
    try {
      const result = await calibrationJobService.submitJob(settings);
      setJobId(result.jobId);
      setJobStatus(result.status as any);
    } catch (e) {
      setJobStatus('failed');
    }
  };

  // Cancel job
  const cancelJob = async () => {
    if (!jobId) return;
    
    try {
      const data = await calibrationJobService.cancelJob(projectId, jobId);
      if (data.status === 'cancelled') {
        setJobStatus('idle');
        setJobProgress(0);
        setJobId(null);
        setCancelMessage('Calibration cancelled successfully.');
        setTimeout(() => setCancelMessage(null), 3500);
      } else {
        setCancelMessage('Failed to cancel calibration.');
        setTimeout(() => setCancelMessage(null), 3500);
      }
    } catch (e) {
      setCancelMessage('Failed to cancel calibration.');
      setTimeout(() => setCancelMessage(null), 3500);
    }
  };

  // Fetch latest job for a frame type
  const fetchLatestJob = async (frameType: MasterType) => {
    if (jobStatus === 'queued' || jobStatus === 'running') return;
    
    try {
      const data = await calibrationJobService.getLatestJob(projectId, frameType);
      if (data && data.status === 'success' && data.preview_url) {
        setJobStatus('success');
        return data;
      }
    } catch (e) {
      // Ignore errors (no previous job)
    }
    return null;
  };

  return {
    // State
    jobStatus,
    setJobStatus,
    jobProgress,
    setJobProgress,
    jobId,
    setJobId,
    showSuccess,
    setShowSuccess,
    cancelMessage,
    setCancelMessage,
    calibrationStart,
    setCalibrationStart,
    calibrationEnd,
    setCalibrationEnd,
    qualityAnalysisResults,
    setQualityAnalysisResults,
    
    // Functions
    submitJob,
    cancelJob,
    fetchLatestJob,
  };
} 