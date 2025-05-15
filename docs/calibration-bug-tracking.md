# 🐞 Calibration API Bug Tracking: Formidable File Property Linter Error

This document tracks the investigation and resolution of the formidable file property linter error encountered in the calibration frame upload API. Use this as a living log to avoid redundant tests and document what has been tried.

---

## Bug Summary
- **Issue:** Linter error regarding the file property name in formidable's file object (e.g., `originalFilename`, `name`, `filename`, etc.)
- **Context:** Occurs in the calibration frame upload API route when validating uploaded files.
- **Goal:** Identify the correct property and resolve the linter error for robust file validation.

---

## Step-by-Step Isolation & Fix Plan

| Step | Action | What to Look For | Status | Notes |
|------|--------|------------------|--------|-------|
| 1 | Remove all but test API route | Server starts? | **Done** | All other API files temporarily removed. |
| 2 | Add back calibration API route | Error returns? | **Done** | Server started cleanly, no formidable/file validation errors. Only duplicate /api/test warning. |
| 3 | Add back project-file-metadata API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 4 | Add back activity-feed API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 5 | Add back projects API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 6 | Add back test-upload API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 7 | Add back folders API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 8 | Add back notifications API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 9 | Add back dashboard-stats API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 10 | Add back files API route | Error returns? | **Done** | Server started cleanly, no errors. |
| 11 | Add back file-operations API route | Error returns? | **Done** | Server started cleanly, no errors. All previously removed API routes restored. |
| 12 | If error returns, isolate in culprit file | Pinpoint line | To Do |  |
| 13 | Add logs for all path/dynamic import vars | Any undefined? | To Do |  |
| 14 | Fix the root cause | Server starts cleanly | To Do |  |
| 15 | Restore the rest of your project | Confirm server starts | To Do |  |

---

## Investigation Log
- **Attempts so far:**
  - Checked formidable file object for `originalFilename`, `name`, `filename`—none confirmed as correct by linter.
  - Searched formidable docs and node_modules for property name—uncertain.
  - Next: Isolate error using the plan above.

- **2024-06-09:**
  - Removed all API routes except for `test.ts`.
  - Restarted dev server (`npm run dev`).
  - **Findings:**
    - Server started cleanly with no linter or runtime errors related to formidable or file validation.
    - Duplicate page warning: `pages/api/test.ts` and `app/api/test/route.ts` both resolve to `/api/test` (not related to the calibration bug).
    - Next.js and Python worker both started successfully.
    - No errors observed in logs.

- **2024-06-09:**
  - Restored calibration upload API route (`upload.ts`).
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no formidable or file validation errors appeared.
    - Only warning was about duplicate `/api/test` routes.
    - Formidable linter error did not return at this step.

- **2024-06-09:**
  - Restored project-file-metadata API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored activity-feed API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored projects API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored test-upload API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored folders API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored notifications API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored dashboard-stats API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored files API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors.

- **2024-06-09:**
  - Restored file-operations API route.
  - Restarted dev server.
  - **Findings:**
    - Server started cleanly, no errors. All previously removed API routes have now been restored without triggering the formidable/file validation linter error.

- **Other notes:**
  - File validation logic is otherwise working (type/size checks pass if property is correct).
  - No other API routes or files should interfere during isolation.

---

## Resolution
- **Root cause:** _(to be filled in)_
- **Fix applied:** _(to be filled in)_
- **Date resolved:** _(to be filled in)_

---

_Last updated: 2024-06-09_ 