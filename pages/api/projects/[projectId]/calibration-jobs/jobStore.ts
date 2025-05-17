// Shared in-memory job store for calibration jobs

const jobs: Record<string, { status: string }> = {};

export function getJob(jobId: string) {
  return jobs[jobId];
}

export function setJob(jobId: string, job: { status: string }) {
  jobs[jobId] = job;
}

export function getAllJobs() {
  return jobs;
} 