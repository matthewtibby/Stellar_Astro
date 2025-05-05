# Future Features Backlog

## 1. Persist FITS Metadata in Backend (COMPLETED)

**Description:**
- When a FITS file is uploaded and validated, store the extracted metadata (exposure time, gain, telescope, filter, instrument, object, date_obs, binning, focal length, RA, DEC, etc.) in a database or as part of the file's metadata in storage.
- Update the file listing API to return this metadata with each file.
- This will allow the frontend to always display rich metadata in info popovers, even after reloads or across devices.

**Benefits:**
- Consistent, reliable metadata display for all files.
- Enables advanced search, filtering, and sorting by metadata fields in the future.
- Reduces need to re-validate or re-parse FITS files on demand.

**Steps:**
1. Update backend to save metadata on upload/validation. **(DONE)**
2. Update file listing endpoint to include metadata. **(DONE)**
3. Update frontend to use metadata from API response. **(DONE)** 

## 2. Upload Utility Improvements

### 2.1 Duplicate File Handling
- **Priority**: Medium
- **Status**: Backlog
- **Description**: Implement a mechanism to handle duplicate filenames by appending a counter (e.g., `filename_1.fit`, `filename_2.fit`) when files with the same name are uploaded.
- **Implementation Details**:
  - Add a check in the Python worker's `validate_fits_file` function
  - Query the database to check for existing files with the same name
  - Append a counter if duplicates are found
  - Update the file path accordingly
- **Benefits**: Prevents file overwrites and maintains data integrity
- **Dependencies**: None
- **Estimated Effort**: 2-3 hours

### 2.2 Path Validation Enhancement
- **Priority**: Medium
- **Status**: Backlog
- **Description**: Add robust path validation in the `getFitsFileUrl` function to ensure path structure matches the expected format.
- **Implementation Details**:
  - Add validation for path structure: `{user_id}/{project_id}/{file_type}/{filename}`
  - Implement regex pattern matching for path validation
  - Add detailed error messages for invalid paths
  - Log validation failures for debugging
- **Benefits**: Improves error handling and debugging capabilities
- **Dependencies**: None
- **Estimated Effort**: 1-2 hours 

## Onboarding Tour Improvements
- Integrate onboarding tour with real dashboard elements:
  - Your Dashboard: Home page, all projects
  - New Projects: One-click creation, demo process steps
  - Collaborate: Real-time collaboration (placeholder for now)
  - Community Wall: Published projects, awards, community
- Use real element selectors and highlight actual UI
- Remove demo/example tour when real tour is ready
- Make tour config-driven and user-dismissable
- Polish overlay, step navigation, and progress indicators

## Collaboration Feature
- Add real-time collaboration for projects (placeholder for now)
- UI for inviting collaborators and working together
- Permissions and activity feed for collaboration

## Dashboard Features Backlog (from dashboard_features_reference.md)

### Must Have
- Drag-and-drop upload
  - Status: Backlog
  - Description: Allow users to drag and drop files directly into the upload area for convenience.
- Batch progress indicator
  - Status: Backlog
  - Description: Show progress for all files in a batch upload, not just individual files.
- FITS header validation/feedback
  - Status: Backlog
  - Description: Validate FITS headers on upload and provide user feedback if required fields are missing or malformed.

### Should Have
- Privacy/collaborator options
  - Status: Backlog (Partial)
  - Description: Add UI and backend support for setting project privacy and managing collaborators.
- Thumbnails/previews
  - Status: Backlog (Partial)
  - Description: Show image thumbnails or quick previews for uploaded files in the dashboard.

### Nice to Have
- Activity feed
  - Status: Backlog (Partial)
  - Description: Show a feed of recent project and file activity, including uploads, edits, and comments.
- Notifications/alerts
  - Status: Backlog (Partial)
  - Description: In-app notification center for project events, uploads, and collaboration.
- At-a-glance stats
  - Status: Backlog
  - Description: Display quick stats (total projects, images, storage, etc.) on the dashboard.
- File organization (folders/tags)
  - Status: Backlog
  - Description: Support organizing files by folders and tags, with filtering/searching UI.
- Upload speed/ETA display
  - Status: Backlog
  - Description: Show real-time upload speed and estimated time remaining during uploads.
- Equipment auto-detection
  - Status: Backlog
  - Description: Automatically detect telescope/camera/filter info from FITS headers or metadata.
- "Import from previous" option
  - Status: Backlog
  - Description: Let users import settings, templates, or files from a previous project when creating a new one.

---

(Last updated: onboarding tour audit and future plan) 