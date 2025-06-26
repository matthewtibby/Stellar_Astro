import { useEffect, Dispatch, SetStateAction } from 'react';
import { MasterType } from '../types/calibration.types';

interface UseJobPollingProps {
  jobStatus: string;
  jobId: string | null;
  projectId: string;
  selectedType: MasterType;
  setJobProgress: (progress: number) => void;
  setJobStatus: Dispatch<SetStateAction<'idle' | 'queued' | 'running' | 'success' | 'failed'>>;
  setShowSuccess: (show: boolean) => void;
  setPreviewUrls: (urls: any) => void;
  setPreviewLoadings: (loadings: any) => void;
  setPreviewUrl: (url: string) => void;
  setPreviewLoading: (loading: boolean) => void;
  setQualityAnalysisResults: (results: any) => void;
  modalManagement: any;
  previewUrls: any;
}

export const useJobPolling = ({
  jobStatus,
  jobId,
  projectId,
  selectedType,
  setJobProgress,
  setJobStatus,
  setShowSuccess,
  setPreviewUrls,
  setPreviewLoadings,
  setPreviewUrl,
  setPreviewLoading,
  setQualityAnalysisResults,
  modalManagement,
  previewUrls
}: UseJobPollingProps) => {
  
  // Poll job progress when running/queued
  useEffect(() => {
    if ((jobStatus === 'queued' || jobStatus === 'running') && jobId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/${projectId}/calibration-jobs/progress?jobId=${jobId}`);
          const data = await res.json();
          console.log('[Polling] Progress API response:', data);
          if (typeof data.progress === 'number') {
            setJobProgress(data.progress);
          }
          if (data.status === 'running' && jobStatus !== 'running') {
            setJobStatus('running');
          }
          if (data.status === 'success' || data.status === 'complete') {
            setJobStatus('success');
            setJobProgress(100);
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
  }, [jobStatus, jobId, projectId, setJobProgress, setJobStatus, setShowSuccess]);

  // Handle job success and fetch results
  useEffect(() => {
    if (jobStatus === 'success' && jobId) {
      let isMounted = true;
      setPreviewLoadings((prev: any) => ({ ...prev, [selectedType]: true }));
      
      const fetchResults = async () => {
        const res = await fetch(`/api/projects/${projectId}/calibration-jobs/results?jobId=${jobId}`);
        console.log('[Preview] Results API response:', res);
        if (res.status === 202) {
          console.log('[Preview] Job not complete, retrying fetchResults in 2s');
          setTimeout(fetchResults, 2000);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          console.log('[Preview] Results data:', data);
          if (isMounted && data.results?.preview_url) {
            setPreviewUrls({ ...previewUrls, [selectedType]: data.results.preview_url });
            setPreviewLoadings((prev: any) => ({ ...prev, [selectedType]: false }));
            console.log('[Preview] Setting previewUrl:', data.results.preview_url);
            setPreviewUrl(data.results.preview_url);
            console.log('[Preview] Setting previewLoading to false after setting previewUrl');
            setPreviewLoading(false);
            
            // Notification logic for used/rejected frames
            if (data.results && (typeof data.results.used === 'number' || typeof data.results.rejected === 'number')) {
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

            // Extract quality analysis results
            if (data.diagnostics && data.diagnostics.quality_analysis) {
              setQualityAnalysisResults(data.diagnostics.quality_analysis);
              const hasIssues = data.results.rejected > 0 || 
                              (data.diagnostics.quality_analysis.summary && 
                               data.diagnostics.quality_analysis.summary.average_quality < 7);
              modalManagement.setShowQualityReport(hasIssues);
            }
          } else {
            console.log('[Preview] No preview_url found in results:', data.results);
          }
        } else {
          setPreviewLoadings((prev: any) => ({ ...prev, [selectedType]: false }));
          console.error('[Preview] Results API not ok:', res.status);
        }
      };
      fetchResults();
      return () => { isMounted = false; };
    }
  }, [jobStatus, jobId, projectId, selectedType, setPreviewUrls, setPreviewLoadings, setPreviewUrl, setPreviewLoading, setQualityAnalysisResults, modalManagement, previewUrls]);
}; 