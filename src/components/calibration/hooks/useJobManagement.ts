import { useState } from 'react';

export type JobStatus = 'idle' | 'queued' | 'running' | 'success' | 'failed';

export const useJobManagement = () => {
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | null>(null);

  const submitCalibrationJob = async (settings: any) => {
    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Job submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      setJobId(result.job_id);
      setJobStatus('queued');
      
      return result;
    } catch (error) {
      console.error('Error submitting calibration job:', error);
      setJobStatus('failed');
      throw error;
    }
  };

  const handleCreateMaster = () => {
    setJobStatus('running');
    setJobProgress(0);
    
    // Simulate job progress
    const progressInterval = setInterval(() => {
      setJobProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    // Simulate job completion after some time
    setTimeout(() => {
      clearInterval(progressInterval);
      setJobProgress(100);
      setJobStatus('success');
    }, 8000);
  };

  const handleCreateMasterWithRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);

    handleCreateMaster();
  };

  const handleCancelJob = async () => {
    if (!jobId) return;

    try {
      const response = await fetch('/api/jobs/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        throw new Error(`Job cancellation failed: ${response.statusText}`);
      }

      setJobStatus('idle');
      setJobProgress(0);
      setJobId(null);
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/status?job_id=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to check job status');
      }

      const statusData = await response.json();
      setJobStatus(statusData.status);
      
      if (statusData.progress !== undefined) {
        setJobProgress(statusData.progress);
      }

      return statusData;
    } catch (error) {
      console.error('Error polling job status:', error);
      throw error;
    }
  };

  const resetJob = () => {
    setJobStatus('idle');
    setJobProgress(0);
    setJobId(null);
  };

  return {
    // State
    jobStatus,
    jobProgress,
    jobId,
    
    // Actions
    setJobStatus,
    setJobProgress,
    setJobId,
    submitCalibrationJob,
    handleCreateMaster,
    handleCreateMasterWithRipple,
    handleCancelJob,
    pollJobStatus,
    resetJob,
  };
}; 