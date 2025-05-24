# Dashboard, Upload, and Calibration Migration Plan

This document outlines the recommended actions for restoring advanced features from the `recovery-1428e19` branch to the current codebase, based on a file-by-file diff.

---

## Dashboard

| File | Action | Rationale |
|------|--------|-----------|
| app/dashboard/DashboardClient.tsx | **Restore** | Missing in current branch; contains advanced dashboard UI and logic. |
| app/components/ActivityFeed.tsx | **Restore** | Missing; provides activity feed for dashboard. |
| app/components/DashboardStats.tsx | **Restore** | Missing; provides dashboard stats. |
| app/components/NotificationCenter.tsx | **Restore** | Missing; provides notification center. |
| src/components/DashboardPage.tsx | **Merge/Review** | Modified; compare for lost features, merge advanced logic if needed. |
| src/components/NewProjectModal.tsx | **Restore** | Missing; required for new project creation in dashboard. |
| src/components/OnboardingTour.tsx | **Merge/Review** | Modified; ensure onboarding and tour features are preserved. |
| src/components/ProjectChecklist.tsx | **Merge/Review** | Modified; check for lost checklist/workflow integration. |
| src/components/ProjectManagementPanel.tsx | **Merge/Review** | Modified; check for lost project management features. |
| src/components/ui/ProjectCard.tsx | **Restore** | Missing; required for project card UI in dashboard. |

---

## Upload

| File | Action | Rationale |
|------|--------|-----------|
| src/components/UniversalFileUpload.tsx | **Merge/Review** | Modified; ensure advanced upload logic and UI are preserved. |
| src/components/FitsFileUpload.tsx | **Merge/Review** | Modified; check for lost FITS upload features. |
| src/components/FileManagementPanel.tsx | **Merge/Review** | Modified; check for lost file management features. |
| src/components/FileList.tsx | **Merge/Review** | Modified; check for lost file listing features. |
| components/CalibrationFrameUpload.tsx | **Restore** | Missing; required for calibration frame upload. |
| src/utils/storage.ts | **Merge/Review** | Modified; ensure advanced storage logic is preserved. |
| src/utils/fileOrganization.ts | **Merge/Review** | Modified; check for lost file organization logic. |
| src/utils/fileTagging.ts | **Restore** | Missing; required for file tagging features. |
| src/utils/fileValidation.ts | **Merge/Review** | Modified; check for lost file validation logic. |
| src/utils/fitsValidation.ts | **Merge/Review** | Modified; check for lost FITS validation logic. |

---

## Calibration

| File | Action | Rationale |
|------|--------|-----------|
| src/components/CalibrationScaffoldUI.tsx | **Restore** | Missing; required for calibration workflow UI. |
| src/components/CalibrationUploadScaffold.tsx | **Restore** | Missing; required for calibration upload workflow. |
| python-worker/app/fits_analysis.py | **Restore** | Missing; core backend calibration/stacking logic. |
| python-worker/app/main.py | **Restore** | Missing; backend entrypoint for calibration jobs. |
| python-worker/app/db.py | **Restore** | Missing; backend DB logic for calibration. |
| src/lib/server/astro-processing.ts | **Restore** | Missing; server-side calibration logic. |
| src/lib/server/getDashboardProjects.ts | **Restore** | Missing; server-side dashboard project logic. |
| python-worker/requirements.txt | **Restore** | Missing; required for backend dependencies. |
| python-worker/run.sh | **Restore** | Missing; required for backend worker execution. |
| python-worker/tests/test_fits_analysis.py | **Restore** | Missing; calibration backend test. |
| python-worker/tests/test_regression_pipeline.py | **Restore** | Missing; calibration regression test. |

---

## General Recommendations
- For all files marked **Restore**, copy them directly from `recovery-1428e19` to the current branch.
- For all files marked **Merge/Review**, perform a manual diff and merge advanced features or logic as needed.
- After restoring, run all tests and manually verify dashboard, upload, and calibration workflows.

---

**This plan ensures you recover all advanced features and logic for Dashboard, Upload, and Calibration.** 