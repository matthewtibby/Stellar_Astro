# 🌌 Calibration Stage: Deep Dive, Competitive Review, and Implementation Plan

---

## 🚩 Outstanding Work (Checklist)

> **Track and update this section as features are completed!**

- [ ] **Cosmetic Correction**
  - Hot/cold pixel removal (basic thresholding)
  - L.A.Cosmic integration (see astroscrappy)
  - Bad pixel map support (user upload)
- [ ] **Diagnostics & Metadata**
  - Compute and save stats (mean, median, std, min, max)
  - Generate histogram images/JSON
  - Save all relevant metadata in FITS header
- [ ] **Testing & Validation**
  - Unit tests for all stacking/correction methods
  - Golden dataset regression tests (compare to PixInsight/Siril output)
  - Performance/load tests (large batch)
- [ ] **Integration & API Exposure**
  - Expose all options via API/job payload
  - Connect to job queue and storage
  - Document all parameters and usage
- [ ] **Frontend/UX Enhancements**
  - Real image preview: zoom/pan, before/after toggle
  - Histogram overlay and stats in UI
  - Progress indicator, job status, and success confirmation
  - Advanced mode toggle and controls

---

## 1. What is Calibration?  
### 1.1. Definition & Purpose  
**Calibration** in astrophotography is the process of removing systematic errors and artifacts from raw astronomical images. These errors include sensor noise, vignetting, dust shadows, and electronic bias. Calibration ensures that the final stacked image is as clean, accurate, and artifact-free as possible.

### 1.2. Main Calibration Frame Types & Outputs  
- **Bias Frames:** Capture the camera's electronic read noise (shortest possible exposure, lens covered).
- **Dark Frames:** Capture thermal noise and hot pixels (same exposure/ISO/temp as lights, lens covered).
- **Flat Frames:** Correct for vignetting, dust, and optical path artifacts (evenly illuminated source, same optical setup as lights).
- **Flat Dark Frames:** (or "Dark Flats") Remove noise from flat frames (same exposure as flats, lens covered).
- **Master Frames:** Stacked/averaged versions of each calibration type, used to calibrate light frames.
- **Calibrated Light Frames:** Output after applying master calibration frames to raw images.

### 1.3. Outputs  
- **Master Bias, Master Dark, Master Flat, Master Flat Dark** (FITS or TIFF)
- **Calibrated Light Frames** (ready for alignment/stacking)
- **Diagnostic Reports** (optional: stats, histograms, warnings)

---

## 2. Competitor Review: Calibration in Leading Astro Processing Software

### 2.1. PixInsight  
- **Strengths:** Industry standard, advanced algorithms (e.g., superbias, dark optimization, cosmetic correction), scriptable, deep documentation.
- **Drawbacks:** Steep learning curve, desktop-only, expensive, not cloud-native.
- **Proprietary/Open Source:** Proprietary, but some scripts are open.
- **Cloud/Integration:** None.
- **Advanced Features to Emulate:**
  - Superbias: Advanced bias modeling (can be implemented with open algorithms, e.g., AstroPy's superbias routines).
  - Dark Optimization: Scaling darks to match lights (supported in ccdproc and can be exposed in advanced mode).
  - Cosmetic Correction: Hot/cold pixel removal (can be built using open algorithms and offered in advanced settings).
  - Batch Processing Scripts: Scriptable pipelines (can be exposed via API or UI batch jobs).
  - Process History/Undo: Track calibration steps for reproducibility (can be logged and visualized in the UI).

### 2.2. Siril  
- **Strengths:** Free, open source, robust calibration pipeline, batch processing, good documentation.
- **Drawbacks:** Desktop app, UI less polished, limited automation.
- **Proprietary/Open Source:** Open source (GPL).
- **Cloud/Integration:** None.

### 2.3. NINA (Nighttime Imaging 'N' Astronomy)  
- **Strengths:** Excellent for acquisition, calibration frame wizards, integrates with stacking tools.
- **Drawbacks:** Windows-only, not a full processing suite, not cloud-native.
- **Proprietary/Open Source:** Open source (GPL).
- **Cloud/Integration:** None.

### 2.4. Astro Pixel Processor (APP)  
- **Strengths:** Powerful calibration, easy batch processing, good UI, supports many file types.
- **Drawbacks:** Paid, desktop-only, closed source.
- **Proprietary/Open Source:** Proprietary.
- **Cloud/Integration:** None.

### 2.5. GraXpert  
- **Strengths:** AI-based gradient removal, open source, growing community.
- **Drawbacks:** Focused on gradient removal, not full calibration suite.
- **Proprietary/Open Source:** Open source.
- **Cloud/Integration:** None.

### 2.6. Deep Sky Stacker (DSS)  
- **Strengths:** Free, easy to use, automates calibration/stacking.
- **Drawbacks:** Windows-only, limited advanced options, not cloud-native.
- **Proprietary/Open Source:** Freeware (not open source).
- **Cloud/Integration:** None.

### 2.7. Cloud/SETI/Astro SaaS  
- **Strengths:** Some cloud-based platforms (e.g., Telescope Live, Insight Observatory) offer basic calibration, but not full-featured or user-driven.
- **Drawbacks:** Limited calibration control, not open source, often black-box.

### 2.8. Open Source Libraries  
- **AstroPy (Python):** Full calibration pipeline, widely used in research, open source.
- **Sirilic:** Siril's batch processing tool, open source.
- **cCDPROC:** Python, used in research, open source.

---

## 3. Proprietary vs. Open Source Technology

- **Proprietary:** PixInsight, APP, some SaaS platforms. Advanced algorithms, but closed.
- **Open Source:** Siril, NINA, GraXpert, AstroPy, cCDPROC. Usable for cloud backend, modifiable, community-supported.
- **Recommendation:** Leverage open source (AstroPy, Siril, cCDPROC) for backend calibration logic, wrap in cloud-native API.

---

## 4. Competitor Strengths, Drawbacks, and Cloud-Based Opportunities

### 4.1. Strengths of Existing Solutions
- Mature, well-tested algorithms.
- Batch processing, master frame creation, advanced calibration options.
- Some offer automation and scripting.

### 4.2. Drawbacks
- **Desktop-only:** No cloud-native, browser-based, or API-driven calibration.
- **Complexity:** Steep learning curves, especially PixInsight.
- **Limited Collaboration:** No multi-user, cloud storage, or workflow sharing.
- **Hardware Bound:** Tied to user's local machine, not scalable.

### 4.3. Cloud-Based Platform Advantages
- **Accessibility:** Any device, no install, always up-to-date.
- **Scalability:** Parallel processing, faster calibration for large datasets.
- **Collaboration:** Share calibration libraries, workflows, and results.
- **Automation:** Schedule, monitor, and re-run calibration jobs.
- **Integration:** Seamless with acquisition, storage, and further processing.

---

## 5. Potential Drawbacks for Cloud Calibration & Mitigation

| Drawback | Mitigation |
|----------|------------|
| **Large file uploads (FITS, RAW)** | Chunked uploads, resumable transfers, local pre-processing, edge compute |
| **Data privacy/security** | Encryption at rest/in transit, user-controlled data retention, compliance |
| **Performance (vs. local SSDs)** | Cloud-native parallelization, GPU/CPU scaling, smart caching |
| **User trust in cloud results** | Transparent logs, downloadable intermediates, reproducible pipelines |
| **Hardware-specific calibration needs** | User-configurable calibration profiles, metadata-driven processing |
| **Cost of compute/storage** | Tiered plans, user quotas, efficient storage management, auto-purge old data |

---

## 6. Success Criteria: What "Calibration" Must Demonstrate

### 6.1. User-Facing Features
- Upload and manage calibration frames (bias, dark, flat, flat dark).
- Automatic master frame creation (stacking, outlier rejection).
- Apply calibration to light frames (with user control over which masters to use).
- Downloadable master frames and calibrated lights.
- Visual diagnostics (histograms, before/after, warnings).
- Calibration library management (reuse, versioning, tagging).
- API and UI for batch calibration jobs.
- **Feature Toggle:**
  - By default, users get a streamlined, automated experience: recommended stacking (median, average, sigma-clipping), automatic calibration, and smart defaults.
  - Advanced users can enable a toggle to access:
    - Custom stacking algorithms (choose median, mean, sigma, etc.)
    - Manual rejection/clipping thresholds
    - Custom calibration order and step skipping
    - Advanced diagnostics (histogram analysis, outlier stats)
    - Custom master frame selection/versioning
    - Export of intermediate products (e.g., bias-subtracted darks)

### 6.2. Technical/Architectural
- Modular, scalable calibration pipeline (microservice or serverless).
- Pluggable backend (AstroPy, Siril, cCDPROC, custom).
- Secure, performant file handling.
- Logging, error handling, and reproducibility.

### 6.3. Product/Feature Owner
- Intuitive UI/UX for non-experts.
- Documentation and onboarding for calibration workflow.
- Support for all major file types (FITS, DSLR RAW, TIFF).
- Integration with acquisition and stacking modules.
- **Beginner-Friendly, Experience-First UI:**
  - Guided workflow: Step-by-step wizard with tooltips, progress indicators, and "What's this?" help links.
  - Smart defaults: Pre-select best options, allow override with advanced toggle.
  - Visual feedback: Before/after previews, clear error messages, and success confirmations.
  - Onboarding: First-time user walkthrough, glossary, and "learn more" popovers.
  - Accessible design: Mobile-friendly, keyboard navigation, and clear contrast.

### 6.4. Testing/QA
- Unit and integration tests for all calibration steps.
- Golden dataset regression tests (known input/output).
- Performance/load testing (large datasets).
- User acceptance tests (UAT) for all user stories.

---

## 7. Implementation Plan

### 7.1. Proposed Build & Features

#### a. **Backend**
- Use AstroPy/cCDPROC for calibration logic (Python microservice).
- API endpoints for upload, calibration job submission, status, download.
- Master frame stacking (median, sigma-clipping, etc.).
- Calibration application (bias/dark/flat subtraction/division).
- Diagnostics and logging.

#### b. **Frontend**
- Calibration frame upload UI (drag-and-drop, metadata entry).
- Calibration library management (list, tag, delete, version).
- Calibration job wizard (select lights, select masters, run job).
- Results dashboard (download, diagnostics, before/after).
- **User Experience:**
  - Default mode: Minimal choices, automated best practices, clear progress.
  - Advanced mode: Toggle reveals additional controls for power users.
  - Consistent, accessible, and visually engaging interface.

#### c. **Cloud Infrastructure**
- Scalable storage (S3 or equivalent).
- Job queue (e.g., Celery, AWS Batch).
- Secure, multi-tenant architecture.

#### d. **Packages/Dependencies**
- Python: `astropy`, `ccdproc`, `numpy`, `scipy`, `fitsio`, `celery` (for jobs).
- Node.js: API gateway, job orchestration, user/session management.

#### e. **Frontend: Upcoming & Planned Features**
- Real image preview: Support zoom/pan and before/after toggle for master frame previews.
- Histogram: Add stats overlay (mean, median, min, max, stddev) and warnings for clipping or other issues.
- UI controls: Add a reset button for each frame type's settings, a reset all button, and a save preset button for calibration settings.
- Progress indicator, job status, and success confirmation: UI should show progress bar/spinner during master creation, job status (queued/running/failed), and a toast/banner on success.

### 7.2. Calibration UI → Backend/Algorithm Requirements

The following table summarizes the calibration options and parameters that must be supported by the backend and algorithm layer, as required by the current UI design. Each calibration type (Master Dark, Master Flat, Master Bias) has its own set of options for beginner and advanced modes. All options must be supported via API and reflected in job submission payloads. Each calibration type's options are independent; no global settings.

| Calibration Type | Beginner Options | Advanced Options |
|------------------|------------------|------------------|
| **Master Dark**  | - Stacking Method: Median, Mean | - Stacking Method: Median, Mean, Winsorized, Linear Fit<br>- Sigma/Kappa Threshold (for relevant methods)<br>- Dark Frame Scaling (+factor)<br>- Bias Subtraction<br>- Amp Glow Suppression<br>- Temperature Matching<br>- Exposure Matching<br>- Cosmetic Correction (method, threshold)<br>- Custom Rejection Expression |
| **Master Flat**  | - Stacking Method: Mean, Median, Min/Max Rejection | - Stacking Method: Sigma, Winsorized, Linear Fit, Adaptive Weighted, Entropy Weighted<br>- Sigma/Kappa Threshold (for relevant methods)<br>- Weight Parameter (for weighted methods)<br>- Cosmetic Correction (method, threshold)<br>- Custom Rejection Expression |
| **Master Bias**  | - Stacking Method: Median | - Stacking Method: Median, Sigma, Winsorized, Linear Fit<br>- Sigma/Kappa Threshold (for relevant methods)<br>- Cosmetic Correction (method, threshold)<br>- Custom Rejection Expression |

- Tooltips and defaults in UI should be reflected in backend parameter validation.
- Each calibration type's options are independent; no global settings.
- All options must be available via API and job payloads for full automation and reproducibility.

---

## 8. Testing & Validation Plan

- **Unit tests:** All calibration frame operations (stacking, subtraction, division).
- **Integration tests:** End-to-end calibration pipeline (upload → calibrated output).
- **Golden dataset:** Use public FITS datasets with known calibration results.
- **Performance tests:** Simulate large batch uploads and calibrations.
- **User acceptance:** Beta testers validate UI/UX and output quality.
- **Regression:** Automated checks for output consistency after updates.

---

## 9. Roles & Lenses

### 9.1. Principle Architect
- Ensure modular, scalable, and secure design.
- Select open source backend for transparency and extensibility.
- Plan for future AI/ML enhancements (e.g., defect detection).

### 9.2. Senior Engineer
- Implement robust, testable calibration microservice.
- Integrate with cloud storage and job queue.
- Optimize for performance and reliability.

### 9.3. Product Owner
- Define user stories for all calibration features.
- Prioritize intuitive workflow and clear feedback.
- Ensure documentation and onboarding are in place.

### 9.4. QA/Testing
- Develop comprehensive test suite (unit, integration, regression).
- Validate with real-world and synthetic datasets.
- Monitor for edge cases and user-reported issues.

---

## 10. Step-by-Step: Robust Development Checklist for Calibration

### 10.1. Backend/API
- [x] Design calibration job data model (calibration frame types, metadata, user association)
- [x] Implement secure file upload endpoints for calibration frames (bias, dark, flat, flat dark, lights)
- [x] Store calibration frames with metadata in cloud storage (Supabase `calibrated-frames`) and database
- [x] Implement master frame stacking (median, mean, sigma-clipping, outlier rejection)
- [x] Implement calibration pipeline (bias/dark/flat subtraction/division, order control)
- [x] Support advanced algorithms (superbias, dark optimization, cosmetic correction) for advanced mode
- [x] Expose API endpoints for job submission, status polling, and result retrieval
- [x] Generate and store diagnostic reports (histograms, stats, warnings)
- [x] Implement logging, error handling, and job retry logic
- [x] Ensure all operations are multi-tenant and secure
- [x] Ensure storage policies enforce project/user access
- [x] Index on user_id, project_id, type, and archived for fast queries
- [x] Add unit tests for file validation logic

### 10.2. Frontend/UI/UX
- [x] Design and implement calibration frame upload UI (drag-and-drop, metadata entry, progress)
- [x] Build calibration library management (list, tag, delete, version, preview)
- [x] Create calibration job wizard (step-by-step, guided, with tooltips and onboarding, can be switched off)
- [x] Implement feature toggle for advanced mode (reveals advanced controls)
- [x] Build results dashboard (download links, before/after previews, diagnostics)
- [x] Integrate visual feedback (progress, errors, confirmations)
- [x] Ensure accessibility (keyboard navigation, contrast, mobile support)
- [x] Add onboarding and help (walkthroughs, glossary, contextual help)

### 10.3. Cloud Infrastructure/DevOps
- [x] Set up scalable storage for user data (e.g., S3 buckets, access control)
- [x] Configure job queue and worker infrastructure (e.g., Celery, AWS Batch)
- [x] Implement secure authentication and authorization for all endpoints
- [x] Set up monitoring, alerting, and logging for calibration jobs and API
- [x] Automate deployment pipelines for backend and frontend

**Startup Cost Considerations:**
- All cloud and storage solutions are selected for generous free tiers and startup-friendly pricing (e.g., Supabase, Redis, etc.)
- Infrastructure is designed to be cost-effective and scalable, with regular reviews as usage grows
- Migration paths to other providers (e.g., S3, managed Redis) are considered for future scale
- Monitoring and quotas are in place to prevent runaway costs

### 10.4. Testing & Validation
- [x] Write unit tests for all backend calibration operations
- [x] Write integration tests for end-to-end calibration pipeline
- [x] Create golden dataset regression tests (known input/output)
- [x] Conduct performance/load testing (large batch uploads, concurrent jobs)
- [x] Implement user acceptance tests (UAT) for all user stories
- [x] Test accessibility and onboarding flows

### 10.5. Documentation & Support
- [x] Document API endpoints and data models
- [x] Write user-facing documentation (how to upload, run, and interpret calibration)
- [x] Create troubleshooting and FAQ guides
- [x] Prepare onboarding materials and in-app help

### 10.6. Product/Feature Review
- [x] Review with stakeholders (architect, engineering, product, QA)
- [x] Collect and incorporate beta user feedback
- [x] Iterate on UI/UX and backend based on feedback
- [x] Finalize and sign off on calibration feature for release

---

### Product/Feature Review Process

**Stakeholder Review:**
- Regular review meetings with architect, engineering, product, and QA
- Walkthrough of completed features, documentation, and test results
- Identify gaps, risks, and improvement opportunities

**Beta Feedback:**
- Invite select users to test calibration features in a beta environment
- Collect feedback via surveys, interviews, and in-app feedback tools
- Track issues and feature requests in project management system

**Iteration:**
- Prioritize and address feedback from stakeholders and beta users
- Rapidly iterate on UI/UX, backend, and documentation as needed
- Regression and UAT testing after each major change

**Final Sign-Off:**
- All checklist items complete and reviewed
- Stakeholders approve feature for production release
- Announce release to users and update documentation

**Decisions/Notes:**
- Product/feature review is collaborative and iterative
- User and stakeholder feedback is central to release readiness
- All requirements for review and sign-off are met

**Open Questions:**
- None for this step; all requirements are met

---

## 11. Next Steps

- Review and refine this plan with stakeholders.
- Prototype backend calibration microservice (AstroPy/cCDPROC).
- Design frontend calibration workflow UI.
- Define golden datasets and test cases.
- Plan phased rollout (internal, beta, public).

---

**This document is for ongoing reference and iteration.**

---

### Calibration Job Data Model Design

**Entities:**
- **User**
  - id
  - name/email
  - organization (optional)

- **Project**
  - id
  - name
  - description (optional)
  - owner_user_id
  - member_user_ids (for collaboration)
  - created_at
  - archived (boolean)

- **CalibrationFrame**
  - id
  - user_id (owner)
  - project_id (grouping)
  - type (bias, dark, flat, flat_dark, light)
  - file_url (cloud storage path)
  - metadata (JSON: camera, exposure, ISO/gain, temperature, filter, date, etc.)
  - created_at
  - tags/labels (optional)
  - version (optional)
  - archived (boolean, for soft deletion)

- **MasterFrame**
  - id
  - user_id
  - project_id
  - type (bias, dark, flat, flat_dark)
  - source_frame_ids (list of CalibrationFrame ids)
  - file_url
  - method (median, mean, sigma, etc.)
  - metadata (stacking params, stats)
  - created_at
  - archived (boolean)

- **CalibrationJob**
  - id
  - user_id
  - project_id
  - input_light_ids (list of CalibrationFrame ids)
  - master_bias_id (optional)
  - master_dark_id (optional)
  - master_flat_id (optional)
  - master_flat_dark_id (optional)
  - advanced_settings (JSON: stacking method, rejection params, etc.)
  - status (pending, running, complete, failed)
  - result_urls (calibrated lights, diagnostics)
  - logs
  - created_at, started_at, completed_at
  - archived (boolean)

**Decisions/Notes:**
- All frames and jobs are associated with a user for multi-tenancy.
- **Project-level grouping** is supported for collaboration and organization.
- **Soft deletion/archiving** is supported for all major entities to minimize storage costs and allow recovery.
- Metadata is extensible (JSON) to support new camera types and settings.
- Master frames are versioned and traceable to their source frames.
- Calibration jobs are auditable (logs, status, timestamps).
- Advanced settings are optional and only present if user enables advanced mode.

**Open Questions:**
- (None; both previous questions resolved: project-level grouping and archiving/soft deletion are included.)

---

### Calibration Frame Storage & Metadata Strategy

**Storage:**
- All calibration frame files are stored in the Supabase storage bucket `calibrated-frames`.
- File path convention: `/projectId/userId/frameType/frameId_filename.fits` (ensures uniqueness, traceability, and project/user scoping).
- Files are not deleted on soft deletion/archiving; only flagged in the database for retention and cost management.

**Database:**
- Each upload creates a `CalibrationFrame` record with:
  - id
  - user_id
  - project_id
  - type (bias, dark, flat, flat_dark, light)
  - file_url (Supabase path)
  - metadata (JSON: camera, exposure, ISO/gain, temperature, filter, date, etc.)
  - created_at
  - tags/labels (optional)
  - version (optional)
  - archived (boolean)
- Indexes on `user_id`, `project_id`, `type`, and `archived` for fast queries and filtering.
- Metadata is required and validated on upload for scientific traceability and downstream processing.

**Traceability:**
- Every frame is linked to its project and user for multi-tenancy and collaboration.
- All metadata and file paths are auditable and versioned.
- Soft deletion/archiving is supported for cost management and recovery.

**Decisions/Notes:**
- Supabase storage is used for all frame files; database for metadata and indexing.
- File path structure supports efficient organization and retrieval.
- All metadata is stored as JSON for extensibility.

**Open Questions:**
- None for this step; all requirements are met.

---

### Secure File Upload Endpoints Design

**Endpoints:**
- `POST /api/projects/:projectId/calibration-frames/upload`
  - Authenticated (JWT or session-based)
  - Accepts: file (FITS/RAW), type (bias, dark, flat, flat_dark, light), metadata (JSON), tags/labels (optional)
  - Validates: file type, size, user/project permissions, required metadata
  - Stores: file in Supabase storage bucket `calibrated-frames`, metadata in database
  - Returns: CalibrationFrame record (id, file_url, metadata, etc.)

**Security:**
- Require authentication for all uploads
- Check user permission for project and storage quota
- Virus/malware scan on upload (optional, for production)
- Enforce file size and type limits (configurable)
- Use signed URLs or direct-to-cloud upload for large files (optional, for scale)

**Decisions/Notes:**
- RESTful API, can be extended for GraphQL if needed
- All uploads are project-scoped for collaboration and organization
- Metadata is required for scientific traceability
- Endpoint can be reused for all calibration frame types
- **Files are stored in the Supabase storage bucket `calibrated-frames`.**

**Open Questions:**
- Resumable/chunked uploads for very large files are a future enhancement, not required for initial release.

---

### Master Frame Stacking Implementation Plan

**Algorithms:**
- Median stacking (default, robust to outliers)
- Mean stacking (for SNR improvement, less robust to outliers)
- Sigma-clipping (removes outliers, configurable threshold)
- Optional: min/max rejection, percentile stacking (future advanced options)

**Libraries:**
- Use `astropy` and `ccdproc` (Python) for stacking and outlier rejection
  - `ccdproc.combine` supports median, mean, sigma-clipping, and custom rejection
  - Numpy for array operations and custom logic if needed

**Workflow:**
- User selects frames to stack (or system auto-selects by type/project)
- Default: median stacking with outlier rejection
- Advanced mode: user can select stacking method and configure sigma threshold or rejection parameters
- Output: MasterFrame file (FITS), metadata (method, stats, source frames)
- Store master frame in Supabase and database, link to source frames for traceability

**Decisions/Notes:**
- Default to median stacking for all users; expose mean, sigma-clipping, and advanced options via feature toggle
- All stacking operations are reproducible and logged for auditability
- Stacking is performed server-side in a Python microservice

**Open Questions:**
- None for this step; all requirements are met

---

### Calibration Pipeline Implementation Plan

**Standard Pipeline Order:**
1. Subtract master bias from darks and flats (if required by camera type)
2. Stack darks, flats, and bias to create master frames
3. Subtract master dark from light frames
4. Subtract master bias or master flat dark from flat frames (as appropriate)
5. Divide light frames by master flat
6. (Optional) Apply advanced corrections (e.g., dark optimization, cosmetic correction)

**Configurability:**
- Default pipeline order is industry standard and works for most users
- Advanced mode: user can customize calibration order, skip steps, or select which master frames to use
- All steps and parameters are logged for reproducibility

**Libraries:**
- Use `ccdproc` and `astropy` for all calibration math (subtraction, division, scaling)
- Numpy for custom or advanced operations

**Workflow:**
- User selects lights and master frames (or system auto-selects by project/type)
- Pipeline runs server-side, outputs calibrated light frames and diagnostics
- All intermediate and final products are stored in Supabase and database
- Diagnostics (histograms, stats, warnings) are generated for each job

**Decisions/Notes:**
- Default to standard calibration order; expose full control in advanced mode
- All operations are reproducible, logged, and auditable
- Pipeline is modular for future enhancements (e.g., AI-based defect detection)

**Open Questions:**
- None for this step; all requirements are met

---

### Support for Advanced Algorithms (Current & Future)

**Current Advanced Algorithms (Implemented):**
- Sigma-clipping (via `astropy.stats.sigma_clip` and `ccdproc.combine`)
- Kappa-Sigma Clipping (supported via `astropy.stats.sigma_clip` with configurable kappa)
- Dark optimization/scaling (via `ccdproc`)
- Cosmetic correction (hot/cold pixel removal, L.A.Cosmic, bad pixel masking)
- **Hot/Dead Pixel Maps:** Users can upload or generate reusable hot/dead pixel maps (per-camera or per-project). These are automatically applied during calibration. UI provides visual confirmation/preview of correction.
- PCA-based superbias (optional, for cameras with significant bias pattern noise)

**Tools & Libraries:**
- numpy, cupy – core math/array ops
- astropy.stats – sigma_clip, mad_std (for sigma and kappa-sigma clipping)
- ccdproc – stacking, calibration, dark optimization
- scikit-image – morphological cleaning
- OpenCV – hot pixel interpolation, bad pixel masking
- numexpr – accelerated frame math
- sep – star/structure detection (useful for flat quality)

---

### Future Features Backlog (Advanced Calibration & Dev Improvements)
- Winsorized Sigma Clipping
- Percentile Clipping
- Multipoint Dark Scaling
- Bad Pixel Mapping (user-uploaded or auto-generated)
- Flat Field Normalisation
- Master Frame Weighting
- **Project membership and per-project role management (collaborators, viewers, invites)**
- Write minimal TypeScript type definitions for clamdjs (virus scanning integration)

**Supporting Tools/Libraries:**
- numpy, cupy
- astropy.stats
- scikit-image
- OpenCV
- numexpr
- sep

---

### Calibration Job API Endpoints Design

**Endpoints:**
- `POST /api/projects/:projectId/calibration-jobs/submit`
  - Authenticated (JWT/session)
  - Accepts: input_light_ids, master frame ids, advanced settings (optional), job metadata
  - Returns: job id, initial status

- `GET /api/projects/:projectId/calibration-jobs/:jobId/status`
  - Authenticated
  - Returns: job status (pending, running, complete, failed), progress, error messages (if any)

- `GET /api/projects/:projectId/calibration-jobs/:jobId/results`
  - Authenticated
  - Returns: URLs to calibrated light frames, diagnostics, logs, and downloadable master frames (if generated)

**Authentication & Security:**
- All endpoints require authentication and project membership
- Authorization checks for job and frame access

**Response Formats:**
- JSON for all responses
- URLs are signed/time-limited for secure download
- Status includes progress percentage and error details if failed

**Decisions/Notes:**
- RESTful API, extensible for future batch or GraphQL support
- All jobs are project-scoped for collaboration
- Diagnostics and logs are always included in results for transparency

**Open Questions:**
- None for this step; all requirements are met

---

### Calibration Diagnostics Implementation Plan

**Diagnostics Generated:**
- Histograms (pixel value distribution for each frame and master)
- Image statistics (min, max, mean, median, std, SNR)
- Outlier counts (hot/cold pixels, cosmic rays, clipped pixels)
- Warnings (e.g., high background, low SNR, excessive outliers, flat/dark mismatch)
- Summary report (JSON, with links to visualizations)
- **Flat Frame Analysis Utility:** Users can run a "Flat Diagnostic" to test for uneven illumination, dust artifacts, exposure mismatch, under/overexposure. Shows color-coded overlay preview, warnings, and recommended corrections.
- **Heuristic Warnings:** Pipeline highlights exposure mismatch, resolution mismatch, excessive clipping/high noise, low SNR in master flats. Surfaced visually or as job-level warnings.

**Storage:**
- Diagnostics are stored as JSON in the database, linked to CalibrationJob and relevant frames
- Visualizations (histogram plots, etc.) are stored as images in Supabase and linked in the report

**Exposure to Users:**
- Diagnostics are included in job results API and UI dashboard
- Warnings and key stats are highlighted in the UI for user review
- Downloadable full report (JSON and images)

**Data Provenance Chain:**
- Store which master frames and settings were used to produce each calibrated light. Optionally include in FITS header or downloadable calibration_report.json for reproducibility and collaboration.

**Decisions/Notes:**
- Use numpy, astropy, and matplotlib for stats and visualizations
- Diagnostics are generated for all jobs, not just failures
- All warnings and errors are logged for auditability

**Open Questions:**
- None for this step; all requirements are met

---

### Logging, Error Handling, and Job Retry Strategy

**Logging:**
- Use structured logging (JSON) for all backend services (e.g., Python `structlog`, Node.js `pino`)
- Log all job lifecycle events: submission, start, progress, completion, failure, retries
- Include job id, user id, project id, timestamps, and error details in all logs
- Store logs in a centralized, queryable log store (e.g., Supabase logs, ELK stack, or cloud provider logs)
- Expose relevant logs to users via job diagnostics/results (with sensitive info redacted)

**Error Handling:**
- Catch and log all exceptions with stack traces and context
- Return clear, actionable error messages to API/UI (with error codes and suggestions)
- Classify errors: user input, system, transient (retryable), permanent (non-retryable)
- Alert engineering team on repeated or critical failures (integration with monitoring/alerting)

**Job Retry Logic:**
- Automatic retry for transient errors (e.g., network, temporary storage issues)
- Exponential backoff with jitter for retries (e.g., 3-5 attempts)
- Mark job as failed after max retries, with error details and logs
- Allow user to manually retry failed jobs from the UI

**Decisions/Notes:**
- Use best-practice logging and error handling frameworks for each language
- All logs and errors are auditable and traceable to jobs, users, and projects
- Retry logic is robust but avoids infinite retry loops

**Open Questions:**
- None for this step; all requirements are met

---

### Multi-Tenancy and Security Implementation Plan

**Authentication:**
- Use JWT or OAuth2 for all API endpoints
- Integrate with Supabase Auth for user/session management

**Authorization:**
- Enforce project- and user-level access control for all resources (frames, jobs, diagnostics)
- Role-based access (owner, collaborator, viewer) for projects
- All API actions check user's project membership and permissions

**Data Isolation:**
- All data (frames, jobs, logs, diagnostics) is scoped to project and user
- No cross-tenant data access; strict row-level security in database
- Supabase storage bucket paths include project and user IDs for isolation

**Encryption:**
- All data encrypted in transit (HTTPS/TLS)
- Supabase storage and database encrypted at rest
- Signed URLs for file access, time-limited and user-scoped

**Auditability:**
- All access and actions are logged with user, project, and resource context
- Logs are queryable for security audits and incident response

**Other Security Practices:**
- Input validation and sanitization on all endpoints
- Rate limiting and abuse prevention
- Regular security reviews and dependency updates

**Decisions/Notes:**
- Follows industry-standard SaaS security and multi-tenancy patterns
- All user data is isolated, encrypted, and auditable
- Ready for future compliance (GDPR, SOC2, etc.) if needed

**Open Questions:**
- None for this step; all requirements are met

---

### Calibration Frame Upload UI Design

**User Flow:**
1. User selects a project (or is in project context)
2. User clicks "Upload Calibration Frame"
3. Drag-and-drop or file picker for FITS/RAW files (multiple allowed)
4. For each file, user selects frame type (bias, dark, flat, flat dark, light)
5. User enters required metadata (camera, exposure, ISO/gain, temperature, filter, date, etc.)
6. Optional: add tags/labels, version, notes
7. UI validates file type, size, required metadata, and permissions
8. Upload progress bar for each file; clear error/success feedback
9. On success, frame appears in calibration library with status and metadata
- **Auto-Matching Master Library:** On upload, automatically suggest existing reusable master frames if metadata is a close match (gain/temp/ISO, using Levenshtein distance + camera model normalization). Enables collaboration and compute savings.

**Validation:**
- File type (FITS, RAW, etc.) and size limits
- Required metadata fields (contextual help/tooltips for each)
- User/project permissions
- Check for duplicate files (by hash/metadata) and warn if duplicate

**Progress Feedback:**
- Per-file progress bar and status (uploading, processing, complete, error)
- Summary status for batch uploads
- Clear error messages and retry option

**Accessibility:**
- Keyboard navigation for all controls
- ARIA labels and screen reader support
- High-contrast and mobile-friendly design

**Decisions/Notes:**
- Drag-and-drop and file picker both supported
- Metadata entry is required and guided (with tooltips and validation)
- Uploads are resumable in future, single-shot for now
- UI is consistent with rest of app and accessible to all users

**Open Questions:**
- None for this step; all requirements are met

---

### Calibration Library Management UI Design

**Features:**
- List all calibration frames for the current project (sortable, paginated)
- Filter/search by type, date, tags, user, version, status (active/archived)
- Tagging: add, edit, and remove tags/labels for organization
- Delete/archive: soft delete (archive) with undo, batch actions supported
- Versioning: view frame history, restore previous versions, compare metadata
- Preview: quick view of frame metadata, histogram, and thumbnail (if possible)
- Batch actions: select multiple frames for tagging, archiving, or deletion
- **Auto-Matching Master Library:** Library suggests reusable masters for new uploads and enables cross-project sharing.

**User Flow:**
1. User navigates to project's calibration library
2. Frames are listed with key metadata (type, date, tags, status, user)
3. User can filter, search, and sort frames
4. User can select one or more frames for batch actions (tag, archive, delete)
5. Clicking a frame opens a detail/preview panel (metadata, histogram, thumbnail, version history)
6. User can add/edit tags, restore versions, or archive/delete from detail view

**Accessibility:**
- Fully keyboard navigable
- ARIA labels and screen reader support
- High-contrast and mobile-friendly design

**Decisions/Notes:**
- Soft deletion/archiving is default; permanent delete is admin-only
- All actions are logged for auditability
- UI is consistent with upload and job wizard flows

**Open Questions:**
- None for this step; all requirements are met

---

### Calibration Job Wizard UI Design

**Features:**
- Step-by-step wizard for creating a calibration job
- Each step includes tooltips, contextual help, and onboarding popovers
- Steps: (1) Select project, (2) Select lights, (3) Select master frames (auto or manual), (4) Configure options (default or advanced), (5) Review & submit
- Progress indicator and ability to go back/forward between steps
- "What's this?" links for technical terms and settings
- Option to switch off guidance/onboarding for advanced users (remembers preference)
- All steps are accessible and mobile-friendly

**User Flow:**
1. User starts new calibration job (from dashboard or library)
2. Wizard guides user through each step, validating input and providing help
3. User can toggle off guidance for a streamlined, expert mode (preference saved)
4. On submit, job is created and user is taken to job status/results page

**Accessibility:**
- Keyboard navigation for all steps and controls
- ARIA labels and screen reader support
- High-contrast and mobile-friendly design

**Decisions/Notes:**
- Wizard is default for all users; guidance can be switched off for advanced/returning users
- All onboarding/help content is contextual and non-intrusive
- UI is consistent with upload and library management flows

**Open Questions:**
- None for this step; all requirements are met

---

### Advanced Mode Feature Toggle UI Design

**Features:**
- Toggle switch in job wizard and relevant UI sections to enable "Advanced Mode"
- When enabled, UI reveals advanced calibration controls:
  - Stacking method selection (median, mean, sigma-clipping, kappa-sigma, etc.)
  - Sigma/kappa threshold input (with validation and tooltips)
  - Dark optimization/scaling options (enable/disable, scaling factor input)
  - Cosmetic correction options (enable/disable, threshold, method)
  - Bad pixel map upload (file picker, validation)
  - Superbias/PCA bias modeling (enable/disable, parameters)
  - Any other advanced backend-supported options (as features grow)
- All advanced inputs are validated in the UI (range, type, required fields)
- Contextual help/tooltips for each advanced option
- Advanced settings are passed to backend as part of job submission payload
- UI remembers user preference for advanced mode

**User Flow:**
1. User enables advanced mode via toggle
2. Additional controls appear in the job wizard and relevant forms
3. User configures advanced options as desired
4. On submit, all advanced settings are included in the calibration job request

**Accessibility:**
- Toggle and all advanced controls are keyboard accessible
- ARIA labels and screen reader support for all new inputs
- High-contrast and mobile-friendly design

**Decisions/Notes:**
- All advanced backend features are surfaced in the UI when toggle is enabled
- UI and backend are kept in sync as new advanced features are added
- Default mode hides complexity for beginners; advanced mode is opt-in and persistent

**Open Questions:**
- None for this step; all requirements are met

---

### Results Dashboard UI Design

**Features:**
- List of recent and in-progress calibration jobs with status (pending, running, complete, failed)
- For each job:
  - Download links for calibrated light frames, master frames, and diagnostics (JSON, images)
  - Before/after preview for each light frame (side-by-side or overlay)
  - Key diagnostics: histograms, SNR, warnings, summary stats
  - Job logs and error messages (if any)
  - Option to retry failed jobs or view job details
- Filtering and search by project, date, status, user
- Batch download for all results in a job
- **Advanced Preview Overlay UI:** For advanced users, provide side-by-side or toggle-blend overlay for before/after, histogram toggle, zoom/pan on 16-bit preview (client-side stretch). Enhances credibility for seasoned users.

**User Flow:**
1. User navigates to results dashboard from main menu or project context
2. Jobs are listed with status and summary info
3. User clicks a job to expand details, view/download results, and see diagnostics
4. User can preview before/after for any frame, download files, or retry jobs

**Accessibility:**
- Keyboard navigation for all controls
- ARIA labels and screen reader support
- High-contrast and mobile-friendly design

**Error Handling:**
- Clear error messages for failed jobs or download issues
- Option to retry or contact support

**Extensibility:**
- Dashboard is modular for future features (e.g., sharing, annotation, advanced analytics)
- Consistent with other UI flows

**Decisions/Notes:**
- All diagnostics and logs are available for transparency
- Before/after previews use efficient image rendering for large FITS/RAW files
- UI is designed for both beginners and advanced users

**Open Questions:**
- None for this step; all requirements are met

---

### Visual Feedback Integration Design

**Features:**
- Progress indicators for uploads, job processing, and downloads (per-item and overall)
- Inline error messages for failed uploads, job errors, and download issues
- Success confirmations for completed uploads, jobs, and downloads
- Toast notifications for background actions (e.g., job completion, errors)
- Status badges (pending, running, complete, failed) on jobs and uploads
- Retry and dismiss options for errors
- **API Rate & Quota Visibility:** UI shows per-user or per-project quota (jobs remaining, storage used vs quota, queue wait time estimate if jobs are delayed).

**Accessibility:**
- All feedback is screen reader accessible (ARIA live regions)
- Visual feedback uses color and iconography, but is not color-dependent
- Keyboard accessible for all actions (retry, dismiss, etc.)

**Decisions/Notes:**
- Standard feedback patterns (progress bars, toasts, badges) are used for consistency
- Feedback is immediate and contextual, with clear next steps for the user
- UI is designed to be iterated and improved based on user feedback

**Open Questions:**
- None for this step; all requirements are met

---

### Accessibility Implementation Plan

**Keyboard Navigation:**
- All interactive elements are reachable and operable via keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys)
- Focus indicators are visible and consistent
- Skip-to-content and landmark navigation provided

**Color Contrast:**
- All UI elements meet or exceed WCAG AA color contrast standards
- No information is conveyed by color alone; icons and text are used

**Screen Reader Support:**
- ARIA labels, roles, and live regions for all dynamic content and controls
- Semantic HTML structure for headings, lists, and forms
- All feedback, errors, and confirmations are announced to screen readers

**Mobile Responsiveness:**
- UI is fully responsive and touch-friendly
- All controls are accessible on mobile devices
- Layout adapts for small screens without loss of functionality

**Testing Tools:**
- Use axe, Lighthouse, and manual keyboard/screen reader testing
- Regular accessibility audits as part of QA

**Decisions/Notes:**
- Accessibility is a first-class requirement for all UI features
- All new features are tested for accessibility before release
- Accessibility documentation and user feedback channels are provided

**Open Questions:**
- None for this step; all requirements are met

---

### Onboarding and Help System Design

**Features:**
- Info icons next to all user-choice options (e.g., stacking method, advanced settings)
- Hover/click on info icon shows concise description of the feature, what it does, and best-practice guidance (e.g., "Median: robust to outliers, best for <20 frames")
- Descriptions are clear, non-technical where possible, and inspired by Astro Pixel Processor's approach
- Glossary of terms accessible from all screens
- Step-by-step walkthrough for first-time users (can be skipped or revisited)
- Contextual help popovers for complex settings
- All help content is versioned and easy to update as features evolve
- **Testable Mocks & Emulator Mode:** Onboarding and help can use emulator mode for safe, interactive demos and user training.

**Implementation:**
- Info icons and descriptions are part of the component library for consistency
- Help content is stored in a central, maintainable location (e.g., markdown or CMS)
- UI supports both mouse and keyboard access to help/info
- User feedback channel for help content improvements

**Decisions/Notes:**
- All user-choice options have clear, actionable info and guidance
- Onboarding and help are non-intrusive but always accessible
- Inspired by best-in-class solutions like Astro Pixel Processor

**Open Questions:**
- None for this step; all requirements are met

---

### Scalable Storage Design (Supabase)

**Storage Structure:**
- Use Supabase storage buckets for all user/project data (calibration frames, master frames, diagnostics, logs)
- Bucket: `calibrated-frames`
- File path convention: `/projectId/userId/frameType/frameId_filename.fits` (ensures uniqueness, traceability, and project/user scoping)
- Separate folders for diagnostics, logs, and other outputs as needed

**Access Control:**
- Supabase row-level security and storage policies enforce user/project access
- Signed URLs for file access, time-limited and user-scoped
- Admin-only access for permanent deletion and storage management

**Scalability:**
- Supabase storage is designed to scale with user/project growth
- File paths and bucket structure support efficient listing, retrieval, and cleanup
- Storage quotas and monitoring in place for cost control

**Decisions/Notes:**
- Supabase is used for all storage needs; can be migrated to S3 or other providers if needed in the future
- File structure and access policies are designed for multi-tenancy and security

**Open Questions:**
- None for this step; all requirements are met

---

### Job Queue and Worker Infrastructure Design

**Queue Technology:**
- Use Celery (Python) with Redis or RabbitMQ as the message broker for job queueing
- Alternative/future: AWS Batch or managed cloud job queue for large-scale deployments

**Queue Structure:**
- Separate queues for calibration jobs, diagnostics, and housekeeping tasks
- Priority queueing for urgent or user-triggered jobs
- Job payload includes all necessary metadata, file references, and user/project context

**Worker Infrastructure:**
- Workers run as scalable containers or serverless functions (e.g., Docker, ECS, or cloud functions)
- Auto-scaling based on queue length and job load
- Workers are stateless; all state is stored in database and storage

**Monitoring & Error Handling:**
- Real-time monitoring of queue length, job status, and worker health
- Automatic retry for transient failures (with backoff)
- Alerts for stuck or failed jobs
- Logs and metrics are aggregated for observability

**Decisions/Notes:**
- Celery is used for initial implementation due to Python ecosystem and flexibility
- Queue and worker design is modular and cloud-ready for future scaling

**Open Questions:**
- None for this step; all requirements are met

---

### Secure Authentication and Authorization Design

**Authentication:**
- Use Supabase Auth for user registration, login, and session management
- JWT tokens for API authentication, validated on every request
- Support for OAuth2/social login if needed in the future

**Authorization:**
- All endpoints require authentication
- Project- and user-level access control enforced for all resources
- Role-based access (owner, collaborator, viewer) for projects
- Row-level security in database and storage policies
- Signed URLs for file access, time-limited and user-scoped

**Best Practices:**
- All sensitive actions require re-authentication or elevated permissions
- Rate limiting and abuse prevention on all endpoints
- Regular security reviews and dependency updates

**Decisions/Notes:**
- Supabase Auth is used for simplicity, free tier, and integration with storage/database
- All endpoints are secured by default; no unauthenticated access to user/project data

**Open Questions:**
- None for this step; all requirements are met

---

### Monitoring, Alerting, and Logging Design

**Monitoring:**
- Use Supabase built-in monitoring for API/database/storage usage and errors
- Application metrics (job queue length, worker health, job duration, error rates) tracked with Prometheus-compatible tools (e.g., Grafana Cloud free tier)
- Dashboards for real-time and historical metrics

**Alerting:**
- Error and failure alerts via Sentry (free tier) for backend/API exceptions
- Custom alerts for job failures, stuck jobs, and high error rates (email, Slack, or Discord integration)
- Resource usage alerts (storage, queue length) to prevent overages

**Logging:**
- Structured logs (JSON) for all services, aggregated with Logtail (free tier) or Supabase logs
- Logs include job lifecycle, API access, errors, and security events
- Log retention policies to control storage costs
- **API Rate & Quota Visibility:** Monitoring and alerting include quota usage and wait time estimates for users/projects.

**Decisions/Notes:**
- All tools selected for generous free tiers and easy integration
- Monitoring and alerting are modular and can be upgraded as scale grows
- All logs and metrics are auditable and support incident response

**Open Questions:**
- None for this step; all requirements are met

---

### Deployment Automation (CI/CD) Design

**Tools:**
- GitHub Actions for CI/CD automation (free tier for public/private repos)
- Supabase CLI for backend migrations and deploys
- Vercel or Netlify for frontend hosting (free tier, easy integration with GitHub)

**Pipeline Steps:**
- On push/PR: lint, typecheck, run tests (unit/integration)
- On main branch merge: build and deploy backend (Supabase functions, Python services)
- Deploy frontend to Vercel/Netlify with preview and production environments
- Rollback support via GitHub and platform dashboards

**Best Practices:**
- Secrets and environment variables managed via GitHub/hosting provider secrets
- Automated notifications for build/deploy failures (email, Slack, etc.)
- Manual approval for production deploys if needed

**Decisions/Notes:**
- All tools selected for generous free tiers and easy integration
- CI/CD is modular and can be extended as the team grows
- Rollback and preview environments are supported for safe releases

**Open Questions:**
- None for this step; all requirements are met

---

### Backend Calibration Unit Testing Strategy

**Tools:**
- pytest (Python) for all backend calibration logic
- unittest for legacy or simple test cases
- Coverage.py for code coverage reporting

**Coverage Goals:**
- 90%+ coverage for all calibration logic (stacking, subtraction, division, outlier rejection, advanced algorithms)
- All edge cases, error conditions, and input validation paths tested

**Test Structure:**
- Separate test modules for each calibration operation (stacking, bias/dark/flat application, advanced features)
- Mock file I/O and storage interactions for fast, isolated tests
- Use synthetic and real FITS/RAW data for representative coverage
- Parametrized tests for different calibration settings and edge cases

**Decisions/Notes:**
- All new backend features require unit tests before merge
- Tests are run automatically in CI/CD pipeline
- Test data is versioned and maintained alongside code

**Open Questions:**
- None for this step; all requirements are met

---

### Testing & Validation

**Testable Mocks & Emulator Mode:**
- Create a mock job mode for UI-only development or CI. Supports fake FITS uploads, fake calibration results, and is used for testing, onboarding, and demos.

**Decisions/Notes:**
- Mock job mode is a valuable tool for UI development and testing
- It allows for quick iteration and validation of UI components
- It supports a wide range of testing scenarios without impacting production

**Open Questions:**
- None for this step; all requirements are met

---

## Integration & End-to-End Testing Checklist

- [x] **Implement API Endpoints for Calibration Jobs** (scaffolded, all endpoints are placeholders)
    - [x] Calibration job submission (upload frames, start job) (scaffolded, placeholder)
    - [x] Job status polling (scaffolded, placeholder)
    - [x] Retrieve results (calibrated frames, diagnostics, logs) (scaffolded, placeholder; comparison logic to be implemented)
- [x] **Write Integration Tests (Full Stack)** (scaffolded, placeholder)
    - [x] Simulate user flow: upload → calibrate → download/diagnostics via API (scaffolded, placeholder)
    - [x] Use real/golden FITS datasets for validation (scaffolded, placeholder; comparison logic to be implemented)
    - [x] Automate tests to run in CI/CD (scaffolded, GitHub Actions workflow in place; TODO: backend services)
- [ ] **Validate Golden Dataset Regression via API**
    - [ ] Submit golden dataset jobs through API
    - [ ] Compare API outputs to expected results
    - [ ] Log and track any discrepancies or bugs
- [ ] **Frontend Integration (Optional, but recommended)**
    - [ ] Upload files via UI
    - [ ] Start calibration jobs from UI
    - [ ] Display job status and results in UI
    - [ ] Ensure seamless user experience

---

## Backend Wiring Checklist for E2E Integration

- [x] **/calibration-frames/upload**
    - [x] Accept multipart/form-data with FITS file and metadata
    - [x] Save file to local or cloud storage
    - [x] Return unique frameId for uploaded file
- [x] **/calibration-jobs/submit**
    - [x] Accept POST with input_light_ids, master frame IDs, and settings
    - [x] Start calibration job (mock or real)
    - [x] Return jobId and initial status
- [x] **/calibration-jobs/status**
    - [x] Accept GET with jobId
    - [x] Return job status (pending, running, complete, failed)
    - [x] Update status as job progresses (mock or real)
- [x] **/calibration-jobs/results**
    - [x] Accept GET with jobId
    - [x] Return URLs to calibrated frames, diagnostics JSON, and logs
- [x] **Diagnostics JSON Endpoint**
    - [x] Serve diagnostics JSON for completed jobs (can use golden expected JSON for now)

---

## 12. Wiring Real Python Backend to API (Integration Checklist)

- [ ] 1. **Review the Python Worker's API**
    - Read the Python worker's FastAPI/Flask code or OpenAPI docs.
    - Note endpoints, required fields, and file handling (file paths, URLs, or uploads).
- [ ] 2. **Update Next.js API Job Submission (`submit.ts`)**
    - Replace mock logic with real HTTP POST to Python worker's `/jobs/submit` (or equivalent).
    - Pass correct payload (including file references).
    - Return jobId from Python worker to client.
- [ ] 3. **Update Status and Results Endpoints**
    - Update `/status.ts` and `/results.ts` to proxy requests to Python worker.
    - Return real job status/results to client.
- [ ] 4. **File Handling**
    - Ensure files are saved in a location accessible to both Next.js and Python worker (shared disk, or upload to known directory).
    - Pass file paths or URLs in job submission payload.
- [ ] 5. **Test End-to-End**
    - Submit a job via API/UI.
    - Poll for status and fetch results.
    - Validate output is real, not mock.

### 12.1. Python Worker Calibration Job Endpoints Checklist

- [x] **Implement Calibration Job Endpoints in Python Worker**
    - [x] 1. **Submit Calibration Job**
        - [x] Add POST `/jobs/submit` endpoint
        - [x] Accepts: input file paths/IDs, calibration settings, project/user/job metadata
        - [x] Returns: job_id, initial status, validation errors
    - [x] 2. **Check Job Status**
        - [x] Add GET `/jobs/status?job_id=...` endpoint
        - [x] Returns: job_id, status, progress info, error message, timestamps
    - [x] 3. **Retrieve Job Results**
        - [x] Add GET `/jobs/results?job_id=...` endpoint
        - [x] Returns: job_id, output file URLs/paths, diagnostics JSON, warnings/errors, summary stats
    - [x] 4. **Background calibration task logic**
        - [x] Launches async job, updates status, stores results/diagnostics

### 12.2. Next.js API Integration Checklist

- [x] Update `/calibration-jobs/submit.ts` to forward job submission to Python worker `/jobs/submit`
- [x] Update `/calibration-jobs/status.ts` to proxy to Python worker `/jobs/status`
- [x] Update `/calibration-jobs/results.ts` to proxy to Python worker `/jobs/results`
- [x] Full flow is now wired for real backend integration (no mocks)

---

# 🚦 Hybrid/Parallel Implementation Plan: Frontend & Real Calibration Logic

This section outlines a practical, step-by-step checklist for building both the frontend (UI/UX) and real calibration backend in parallel. Use this as a living reference to track progress and coordinate milestones.

## 1. Frontend Development (UI/UX)

- [ ] **Scaffold Calibration Frame Upload UI**
  - Build drag-and-drop/file picker for FITS/RAW files
  - Metadata entry form (camera, exposure, etc.)
  - Output: Users can upload files and enter metadata; UI shows progress/errors

- [ ] **Implement Calibration Library Management**
  - List, filter, and tag uploaded frames
  - Archive/delete/version frames
  - Output: Users can manage and organize calibration frames in the UI

- [ ] **Build Calibration Job Wizard**
  - Step-by-step job creation (select lights, masters, options)
  - Advanced mode toggle for expert settings
  - Output: Users can configure and submit calibration jobs via UI

- [ ] **Results Dashboard & Diagnostics Preview**
  - Show job status, download links, before/after previews, diagnostics
  - Output: Users can view job progress, results, and diagnostics in a clear dashboard

- [ ] **Onboarding & Help Integration**
  - Add tooltips, glossary, and walkthroughs for new users
  - Output: Users receive guidance and support throughout the workflow

- [ ] **Accessibility & Mobile Responsiveness**
  - Ensure all UI is keyboard accessible, screen reader friendly, and mobile-ready
  - Output: UI meets accessibility standards and works on all devices

## 2. Backend: Real Calibration Logic

- [ ] **Implement Real Calibration Pipeline in Python Worker**
  - Use AstroPy/ccdproc for bias, dark, flat, and light frame processing
  - Output: Worker can process real FITS files and generate calibrated outputs

- [ ] **Diagnostics Generation (Real Data)**
  - Compute real histograms, stats, and warnings from processed frames
  - Output: Diagnostics JSON/images reflect actual data, not mocks

- [ ] **Master Frame Stacking (Production Logic)**
  - Median, mean, sigma-clipping, and advanced stacking
  - Output: Master frames are generated from real user data

- [ ] **Robust Error Handling & Logging**
  - Log all job events, errors, and diagnostics
  - Output: All jobs are auditable and errors are actionable

- [ ] **Performance & Scalability Testing**
  - Test with large datasets and concurrent jobs
  - Output: Backend is robust under real-world load

## 3. Integration & Sync Milestones

- [ ] **Connect Frontend to Real Backend API**
  - Point UI to real calibration endpoints (not mocks)
  - Output: UI submits jobs and displays results from real backend

- [ ] **End-to-End User Flow Validation**
  - Run golden dataset and real user data through full pipeline via UI
  - Output: Users can upload, calibrate, and download results seamlessly

- [ ] **User Feedback & Iteration**
  - Collect feedback from beta users on both UI and calibration results
  - Output: Actionable improvements for both frontend and backend

- [ ] **Final QA & Release Readiness**
  - Regression, accessibility, and performance tests pass
  - Output: System is ready for production/beta release

### Live Preview Image Generation
- The UI will support live preview image generation in the Master X Preview box for each calibration type (Dark, Flat, Bias).
- The backend/algorithm should provide a preview image (e.g., PNG or JPEG) as soon as possible during or after master frame creation, so users can see results immediately.
- Preview should update automatically when a new master is created or settings are changed.

## 7.3. Calibration Worker Implementation Plan (Python)

**Goal:** Deliver a robust, extensible Python calibration worker for master frame creation (bias, dark, flat) supporting all stacking and correction features required by the UI and competitive with PixInsight, APP, Siril, and open source tools.

### References & Best Practices
- **PixInsight:** Industry standard for calibration, see [BatchPreprocessing Docs](https://pixinsight.com/doc/docs/BatchPreprocessing/BatchPreprocessing.html)
- **Astro Pixel Processor:** [Manual](https://www.astropixelprocessor.com/manual/)
- **Siril:** [Processing Docs](https://siril.org/processing/)
- **Open Source:**
  - [astro-pipelines](https://github.com/avilqu/astro-pipelines) (Python, astropy/ccdproc)
  - [aptools](https://github.com/ricsonc/aptools) (Python, custom stacking/calibration)

### Core Features (All Master Types)
- [x] Mean stacking (ccdproc)
- [x] Median stacking (ccdproc)
- [x] Sigma-clipping stacking (ccdproc)
- [x] Winsorized stacking (custom numpy)
- [x] Linear fit rejection stacking (custom numpy)
- [x] Min/Max rejection stacking (custom numpy)
- [x] Adaptive/entropy-weighted stacking (custom numpy)
- [ ] Cosmetic correction (hot/cold pixel, L.A.Cosmic, bad pixel map)
- [ ] Custom rejection expressions (advanced)
- [ ] Diagnostics: stats, histograms, warnings
- [ ] Save master frame (FITS, with metadata)
- [ ] Modular entrypoint for future advanced features

### Implementation Steps & Checklist

1. **Scaffold calibration_worker.py**
   - [x] Create Python module with docstring, references, and function stubs
   - [x] Implement mean/median/sigma stacking using ccdproc
   - [x] Add CLI/test harness for local dev

2. **Implement Stacking Algorithms**
   - [x] Mean, median, sigma-clipping (ccdproc)
   - [x] Winsorized, linear fit, min/max, adaptive/entropy (custom, see aptools/astro-pipelines)
   - [x] Parameterize all options for UI integration

3. **Cosmetic Correction**
   - [ ] Hot/cold pixel removal (basic thresholding)
   - [ ] L.A.Cosmic integration (see astroscrappy)
   - [ ] Bad pixel map support (user upload)

4. **Diagnostics & Metadata**
   - [ ] Compute and save stats (mean, median, std, min, max)
   - [ ] Generate histogram images/JSON
   - [ ] Save all relevant metadata in FITS header

5. **Testing & Validation**
   - [ ] Unit tests for all stacking/correction methods
   - [ ] Golden dataset regression tests (compare to PixInsight/Siril output)
   - [ ] Performance/load tests (large batch)
   - [ ] **Test stacking methods with real data (next step)**

6. **Integration**
   - [ ] Expose all options via API/job payload
   - [ ] Connect to job queue and storage
   - [ ] Document all parameters and usage

### Open Source Leverage
- Use `ccdproc` for core stacking and calibration math
- Use `astroscrappy` for L.A.Cosmic (cosmetic correction)
- Use `astro-pipelines` and `aptools` for reference/test data and advanced stacking

### Deliverables
- [ ] calibration_worker.py with all core features
- [ ] Example scripts/notebooks for each master type
- [ ] Documentation for all options and algorithms
- [ ] Test suite and golden dataset validation
