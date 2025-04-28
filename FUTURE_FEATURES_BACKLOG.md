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