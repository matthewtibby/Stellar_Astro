# Future Features Backlog

## 1. Persist FITS Metadata in Backend

**Description:**
- When a FITS file is uploaded and validated, store the extracted metadata (exposure time, gain, telescope, filter, instrument, object, date_obs, binning, focal length, RA, DEC, etc.) in a database or as part of the file's metadata in storage.
- Update the file listing API to return this metadata with each file.
- This will allow the frontend to always display rich metadata in info popovers, even after reloads or across devices.

**Benefits:**
- Consistent, reliable metadata display for all files.
- Enables advanced search, filtering, and sorting by metadata fields in the future.
- Reduces need to re-validate or re-parse FITS files on demand.

**Steps:**
1. Update backend to save metadata on upload/validation.
2. Update file listing endpoint to include metadata.
3. Update frontend to use metadata from API response. 