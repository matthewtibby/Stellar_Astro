# Future Features Backlog

> **Note:** This is the canonical backlog. All other feature/backlog files are deprecated and merged here.

## Premium Features

### Beta Features (Available to Super Users)
1. **Advanced Image Processing**
   - AI-powered noise reduction
   - Automatic color calibration
   - Smart stacking algorithms
   - Batch processing capabilities

2. **Enhanced Project Management**
   - Unlimited project storage
   - Advanced project organization
   - Custom project templates
   - Project versioning

3. **Collaboration Tools**
   - Team project sharing
   - Real-time collaboration
   - Project comments and annotations
   - Shared workspaces

4. **Advanced Analytics**
   - Image quality metrics
   - Processing performance tracking
   - Usage statistics
   - Custom reporting

5. **API Access**
   - REST API for automation
   - Webhook integrations
   - Custom script support
   - Third-party integrations

### Planned Features
1. **Cloud Processing**
   - Distributed processing
   - GPU acceleration
   - Priority queue access
   - Custom processing pipelines

2. **Mobile App**
   - Remote monitoring
   - Mobile capture control
   - Quick preview and sharing
   - Offline access

3. **Advanced Export Options**
   - Custom export formats
   - Batch export
   - Cloud storage integration
   - Social media sharing

4. **Educational Resources**
   - Advanced tutorials
   - Expert workshops
   - Community access
   - One-on-one support

5. **Custom Development**
   - Feature requests
   - Custom integrations
   - Priority support
   - Dedicated account manager

## Feature Status Legend
- 🔄 In Development
- 🧪 Beta Testing
- ✅ Released
- 📅 Planned
- 💡 Under Consideration

## Notes
- Super users have access to all beta features
- Features marked as "Planned" are in the roadmap but not yet in development
- Status will be updated as features progress through development

## User Journey Gaps & Opportunities

### Homepage & Discovery of Product/Features
- Interactive onboarding tour or demo for new/logged-out users (**Priority: High**)
- Public gallery or showcase of example projects (**Priority: Medium**)
- More detailed feature explanations and comparison table (**Priority: Medium**)

### Sign Up / Subscribing
- Social login (Google, GitHub, etc.) (**Priority: High**)
- Onboarding wizard after sign up (**Priority: Medium**)
- Clearer upgrade path and feature comparison for subscription tiers (**Priority: Medium**)

### Logging In
- Social login (Google, GitHub, etc.) (**Priority: High**)
- Magic link or 2FA support (**Priority: Medium**)
- "Remember me"/persistent session improvements (**Priority: Low**)

### Dashboard Page
- Public/shared project gallery (**Priority: Medium**)
- Collaboration features (shared with me, team projects) (**Priority: High**)
- Bulk actions for projects (delete, tag, export) (**Priority: Medium**)
- Improved mobile/tablet responsiveness (**Priority: Medium**)

### New Project Creation & Upload
- Bulk upload progress and resumable uploads (**Priority: High**)
- Upload error recovery and better error messages (**Priority: High**)
- Drag-and-drop support for folders (**Priority: Medium**)
- More flexible project templates (**Priority: Low**)

### Project Initial Management
- Advanced tagging and search (custom tags, filters) (**Priority: Medium**)
- Project sharing/collaboration (**Priority: High**)
- Project versioning/history (**Priority: Low**)
- Advanced export options (batch, cloud, social) (**Priority: Medium**)

## Merged Detailed Items from Other Backlog Files

### Undo Project Deletion
- **Description:** After deleting a project, show an 'Undo' option for a short window (e.g., 5 seconds). If the user clicks 'Undo', restore the project and its files to the dashboard. Requires backend support for soft-deletion or a temporary trash bin to allow restoration. Improves user experience and prevents accidental data loss.
- **Priority:** Medium
- **Status:** Backlog
- **Steps:**
  1. Implement soft-delete or trash bin in backend
  2. Show undo UI in frontend after deletion
  3. Restore project/files if undo is clicked

### Persist FITS Metadata in Backend (COMPLETED)
- **Description:** When a FITS file is uploaded and validated, store the extracted metadata (exposure time, gain, telescope, filter, instrument, object, date_obs, binning, focal length, RA, DEC, etc.) in a database or as part of the file's metadata in storage. Update the file listing API to return this metadata with each file. This will allow the frontend to always display rich metadata in info popovers, even after reloads or across devices.
- **Benefits:**
  - Consistent, reliable metadata display for all files.
  - Enables advanced search, filtering, and sorting by metadata fields in the future.
  - Reduces need to re-validate or re-parse FITS files on demand.
- **Steps:**
  1. Update backend to save metadata on upload/validation. **(DONE)**
  2. Update file listing endpoint to include metadata. **(DONE)**
  3. Update frontend to use metadata from API response. **(DONE)**

### Upload Utility Improvements
#### Duplicate File Handling
- **Priority:** Medium
- **Status:** Backlog
- **Description:** Implement a mechanism to handle duplicate filenames by appending a counter (e.g., `filename_1.fit`, `filename_2.fit`) when files with the same name are uploaded.
- **Steps:**
  1. Add a check in the Python worker's `validate_fits_file` function
  2. Query the database to check for existing files with the same name
  3. Append a counter if duplicates are found
  4. Update the file path accordingly
- **Benefits:** Prevents file overwrites and maintains data integrity

#### Path Validation Enhancement
- **Priority:** Medium
- **Status:** Backlog
- **Description:** Add robust path validation in the `getFitsFileUrl` function to ensure path structure matches the expected format.
- **Steps:**
  1. Add validation for path structure: `{user_id}/{project_id}/{file_type}/{filename}`
  2. Implement regex pattern matching for path validation
  3. Add detailed error messages for invalid paths
  4. Log validation failures for debugging
- **Benefits:** Improves error handling and debugging capabilities

### Onboarding Tour Improvements
- **Description:**
  - Integrate onboarding tour with real dashboard elements: Home page, all projects, new projects, collaboration, community wall.
  - Use real element selectors and highlight actual UI.
  - Remove demo/example tour when real tour is ready.
  - Make tour config-driven and user-dismissable.
  - Polish overlay, step navigation, and progress indicators.
- **Priority:** High

### Collaboration Feature
- **Description:**
  - Add real-time collaboration for projects (placeholder for now)
  - UI for inviting collaborators and working together
  - Permissions and activity feed for collaboration
- **Priority:** High

### Dashboard Features Backlog (from dashboard_features_reference.md)
#### Must Have
- Drag-and-drop upload: Allow users to drag and drop files directly into the upload area for convenience. (**Status: Backlog**)
- Batch progress indicator: Show progress for all files in a batch upload, not just individual files. (**Status: Backlog**)
- FITS header validation/feedback: Validate FITS headers on upload and provide user feedback if required fields are missing or malformed. (**Status: Backlog**)

#### Should Have
- Privacy/collaborator options: Add UI and backend support for setting project privacy and managing collaborators. (**Status: Backlog/Partial**)
- Thumbnails/previews: Show image thumbnails or quick previews for uploaded files in the dashboard. (**Status: Backlog/Partial**)

#### Nice to Have
- Activity feed: Show a feed of recent project and file activity, including uploads, edits, and comments. (**Status: Backlog/Partial**)
- Notifications/alerts: In-app notification center for project events, uploads, and collaboration. (**Status: Backlog/Partial**)
- At-a-glance stats: Display quick stats (total projects, images, storage, etc.) on the dashboard. (**Status: Backlog**)
- File organization (folders/tags): Support organizing files by folders and tags, with filtering/searching UI. (**Status: Backlog**)
- Upload speed/ETA display: Show real-time upload speed and estimated time remaining during uploads. (**Status: Backlog**)
- Equipment auto-detection: Automatically detect telescope/camera/filter info from FITS headers or metadata. (**Status: Backlog**)
- "Import from previous" option: Let users import settings, templates, or files from a previous project when creating a new one. (**Status: Backlog**) 
*Calibration*
Resumable/chunked uploads 