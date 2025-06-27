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

## Phase 3: Advanced Cosmic Ray Detection

### 🤖 AI/ML-Powered Detection
- **Machine Learning Detection** (**Priority: High**)
  - Custom neural networks trained on real astronomical data
  - Deep Learning approach using CNN-based cosmic ray detection
  - Transfer learning adapted for different camera types and imaging conditions
  - Real-time learning models that improve from user feedback
  - **Status:** 📅 Planned
  - **Timeline:** Phase 3.1 (2-3 months)

- **Training Dataset Creation** (**Priority: High**)
  - Build training datasets from user-contributed cosmic ray detections
  - Automated data labeling pipeline
  - Quality validation and verification system
  - **Status:** 📅 Planned

### ⚡ GPU Acceleration & Performance
- **CUDA Processing** (**Priority: High**)
  - GPU-accelerated L.A.Cosmic and custom algorithms
  - Parallel processing utilizing GPU cores for massive batch processing
  - Efficient GPU memory management for large images
  - **Performance Target:** 10-100x speed improvement for large datasets
  - **Status:** 📅 Planned
  - **Timeline:** Phase 3.2 (1-2 months)

- **Cloud GPU Support** (**Priority: Medium**)
  - Integration with cloud GPU instances for processing
  - Scalable processing for enterprise users
  - Cost-optimized GPU utilization
  - **Status:** 📅 Planned

### 📊 Advanced Visualization & Analytics
- **3D Cosmic Ray Mapping** (**Priority: Medium**)
  - Visualize cosmic ray distribution across image stacks
  - Interactive 3D visualizations using WebGL/Three.js
  - Temporal analysis tracking patterns over time/sessions
  - **Status:** 📅 Planned
  - **Timeline:** Phase 3.3 (2 months)

- **Statistical Dashboards** (**Priority: Medium**)
  - Advanced analytics on detection patterns
  - Performance benchmarking and comparison tools
  - Export capabilities for research purposes
  - Interactive web-based visualization with zoom and filtering
  - **Status:** 📅 Planned

### 🔄 Seamless Workflow Integration
- **Light Frame Processing Integration** (**Priority: High**)
  - Automatic cosmic ray removal during stacking process
  - Pre-processing pipeline with integrated cosmic ray detection
  - Background processing without user intervention
  - **Status:** 📅 Planned
  - **Timeline:** Phase 3.4 (1 month)

- **Smart Automation** (**Priority: High**)
  - AI decides when cosmic ray detection is needed
  - Workflow templates for different imaging scenarios
  - Context-aware processing understanding image content
  - **Status:** 📅 Planned

### 🛠️ Advanced Algorithm Framework
- **Custom Algorithm Editor** (**Priority: Low**)
  - Visual algorithm designer for power users
  - Plugin architecture for community-contributed algorithms
  - Algorithm marketplace for sharing custom solutions
  - Performance benchmarking on standardized test sets
  - **Status:** 💡 Under Consideration

- **Hybrid Algorithm Approaches** (**Priority: Medium**)
  - Intelligent combination of multiple algorithms
  - Dynamic algorithm selection based on image characteristics
  - User behavior learning and preference adaptation
  - **Status:** 📅 Planned

### 🧠 Intelligent Automation
- **Predictive Analysis** (**Priority: Medium**)
  - Predict cosmic ray likelihood before processing
  - Auto-quality assessment with improvement suggestions
  - Smart parameter evolution that learns over time
  - **Status:** 📅 Planned

- **Real-time Processing** (**Priority: Low**)
  - Live cosmic ray detection during image acquisition
  - WebRTC integration for real-time processing streams
  - Mobile support for cosmic ray detection on tablets/phones
  - **Status:** 💡 Under Consideration

### 📈 Performance Targets
- **ML Detection Accuracy:** >95% precision, >98% recall
- **GPU Speed Improvement:** 10-100x faster processing
- **Batch Processing:** 1000+ images processed simultaneously
- **Memory Efficiency:** Process 100MP+ images with minimal RAM usage
- **Real-time Capability:** Live processing during image acquisition

### 🎯 Competitive Advantage
Phase 3 would establish Stellar Astro as the **world's most advanced cosmic ray detection system**, surpassing PixInsight, Siril, and all existing solutions with:
- Revolutionary AI-powered detection
- Unprecedented GPU acceleration
- Advanced research-grade analytics
- Seamless workflow automation
- Cloud-scale processing capabilities

## Multiple Cosmetic Correction Methods

### 🔧 Multi-Method Selection Enhancement
- **Multiple Cosmetic Corrections** (**Priority: High**)
  - Replace single dropdown with multiple checkbox selection
  - Allow users to run multiple correction methods in sequence
  - Professional workflow alignment with Hot Pixel Map → L.A.Cosmic → Bad Pixel Masking → Patterned Noise
  - **Status:** 📅 Planned
  - **Timeline:** Near-term (2-3 weeks)

- **Method Tooltips & Documentation** (**Priority: High**)
  - Interactive tooltips explaining each correction method
  - Professional descriptions with use cases
  - Method categories (detection, cosmic_rays, masking, noise)
  - **Status:** 📅 Planned

- **Processing Order Control** (**Priority: Medium**)
  - Drag-and-drop reordering of correction methods
  - Visual order indicators (1, 2, 3, etc.)
  - Smart default ordering based on professional workflows
  - **Status:** 📅 Planned

### 📝 Implementation Requirements
- **State Structure Update**: Change from `cosmeticMethod: string` to `cosmeticMethods: Record<string, { enabled: boolean; order: number }>`
- **UI Components**: Replace dropdown with checkbox list with tooltips
- **Backend Integration**: Update processing pipeline to handle multiple methods in sequence
- **Default Configuration**: Enable Hot Pixel Map + L.A.Cosmic Enhanced by default

### 🏗️ Technical Specifications
```typescript
// New cosmetic methods structure
cosmeticMethods: {
  'hot_pixel_map': { enabled: true, order: 1 },
  'la_cosmic_enhanced': { enabled: true, order: 2 },
  'bad_pixel_masking': { enabled: false, order: 3 },
  'patterned_noise_removal': { enabled: false, order: 4 }
}

// Method definitions with tooltips
const COSMETIC_METHODS = [
  { 
    value: 'hot_pixel_map', 
    label: 'Hot Pixel Map',
    tooltip: 'Identifies and masks consistently hot pixels by comparing multiple frames.',
    category: 'detection',
    defaultEnabled: true,
    order: 1
  },
  // ... etc
];
```

### 💡 User Experience Improvements
- **Professional Alignment**: Matches how astrophotographers actually work
- **Better Results**: Multiple corrections address different defect types
- **Educational Value**: Tooltips help users understand each method
- **Flexibility**: Enable/disable methods based on specific needs
- **Processing Efficiency**: Optimal ordering reduces computation time

This enhancement transforms Stellar Astro from a single-method tool to a comprehensive cosmetic correction suite, providing the flexibility and control that serious astrophotographers demand.

## Gradient Correction & Background Extraction

### 🌌 Post-Processing Gradient Correction
- **Advanced Gradient Removal** (**Priority: High**)
  - Professional-grade gradient correction for stacked light frames
  - Multiple algorithm options: Synthetic Flat Field, Polynomial Background, Dynamic Background Extraction (DBE-style)
  - Interactive gradient modeling with user-guided background point selection
  - **Status:** 📅 Planned
  - **Timeline:** Major release (3-4 months)
  - **Dependencies:** Current gradient detection system (✅ Implemented)

- **Background Extraction Engine** (**Priority: High**)
  - Automated background modeling using statistical analysis
  - Support for complex gradients (light pollution, vignetting, flat field errors)
  - Preserve astronomical objects while removing gradients
  - Real-time preview with adjustable parameters
  - **Target Performance:** Process 100MP+ images in <30 seconds
  - **Status:** 📅 Planned

### 🎯 Integration with Calibration Stage
- **Seamless Workflow** (**Priority: High**)
  - Build on existing gradient detection from calibration stage
  - Use detection results to inform correction algorithms
  - Quality scores guide correction strength and method selection
  - **Two-Stage Approach:**
    1. **Calibration Stage:** Detection & validation (✅ **Currently Implemented**)
    2. **Post-Processing Stage:** Gradient correction (📅 **Planned**)
  - **Status:** 📅 Planned

### 🔧 Algorithm Portfolio
- **Synthetic Flat Field Creation** (**Priority: High**)
  - Generate correction frames from light images (Photoshop-style approach)
  - Object removal and background interpolation
  - Gaussian smoothing for large-scale gradient modeling
  - **Compatible with:** All image types, especially nebulae and galaxies
  - **Status:** 📅 Planned

- **Dynamic Background Extraction (DBE)** (**Priority: High**)
  - PixInsight-style DBE implementation
  - User-guided background point selection with interactive UI
  - Mathematical surface modeling (polynomial/spline fitting)
  - Automatic background point suggestion using AI
  - **Compatible with:** Complex gradients, multi-source light pollution
  - **Status:** 📅 Planned

- **Polynomial Background Fitting** (**Priority: Medium**)
  - Mathematical surface fitting (2D polynomial)
  - Configurable polynomial degree (linear, quadratic, cubic)
  - Robust outlier rejection for astronomical objects
  - **Compatible with:** Simple gradients, vignetting correction
  - **Status:** 📅 Planned

### 🖥️ User Interface & Workflow
- **Interactive Gradient Correction Tool** (**Priority: High**)
  - Real-time preview with before/after comparison
  - Adjustable correction strength and smoothing
  - ROI (Region of Interest) selection for targeted correction
  - Mask support to protect astronomical objects
  - **Status:** 📅 Planned

- **Background Point Editor** (**Priority: High**)
  - Click-to-place background sampling points
  - Automatic point suggestion based on image analysis
  - Visual feedback showing gradient model overlay
  - Export/import point sets for batch processing
  - **Status:** 📅 Planned

### 📊 Quality Assessment & Validation
- **Correction Quality Metrics** (**Priority: Medium**)
  - Before/after gradient analysis and scoring
  - Background uniformity improvement measurement
  - Object preservation validation (ensure no detail loss)
  - Statistical analysis of correction effectiveness
  - **Status:** 📅 Planned

- **Method Recommendation Engine** (**Priority: Medium**)
  - AI-powered algorithm selection based on image characteristics
  - Use calibration stage detection results to recommend correction approach
  - Performance benchmarking across different gradient types
  - **Status:** 📅 Planned

### 🚀 Advanced Features
- **Batch Gradient Correction** (**Priority: Medium**)
  - Apply correction settings to multiple images
  - Template-based processing for imaging sessions
  - Cloud processing for large datasets
  - **Status:** 📅 Planned

- **Integration with External Tools** (**Priority: Low**)
  - Export settings for GraXpert, PixInsight, Siril
  - Import correction masks from external software
  - API for third-party integration
  - **Status:** 💡 Under Consideration

### 🏆 Competitive Differentiation
**Stellar Astro Gradient Correction vs. Competitors:**

| Feature | Stellar Astro (Planned) | GraXpert | PixInsight DBE | Siril |
|---------|-------------------------|----------|----------------|-------|
| **Calibration Integration** | ✅ Seamless two-stage | ❌ Standalone | ❌ Separate tool | ❌ Separate tool |
| **Quality-Guided Correction** | ✅ Uses detection scores | ❌ Manual only | ❌ Manual only | ❌ Manual only |
| **Real-time Preview** | ✅ Planned | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multiple Algorithms** | ✅ 3+ methods | ✅ 2 methods | ✅ DBE only | ✅ Limited |
| **Cloud Processing** | ✅ Planned | ❌ Local only | ❌ Local only | ❌ Local only |
| **Web-based** | ✅ Yes | ❌ Desktop app | ❌ Desktop app | ❌ Desktop app |

### 📈 Implementation Roadmap
1. **Phase 1** (Month 1-2): Synthetic flat field algorithm
2. **Phase 2** (Month 2-3): Interactive UI with background point selection  
3. **Phase 3** (Month 3-4): DBE-style dynamic background extraction
4. **Phase 4** (Month 4): Quality metrics and batch processing

### 💡 Technical Innovation
- **First web-based gradient correction** tool with calibration integration
- **AI-guided background point selection** using image analysis
- **Quality-aware processing** that uses calibration detection results
- **Cloud-scale processing** for large imaging sessions
- **Seamless integration** between detection and correction stages

This feature would establish Stellar Astro as the **only astrophotography platform** offering integrated gradient detection (calibration) and correction (post-processing) in a unified web-based workflow, providing significant competitive advantage over existing desktop solutions.

## Storage Utilities: Post-Modularization Optimization & Enhancement Phases

After modularization and error handling, consider these optional future phases for `src/utils/storage.ts` and related modules:

### 1. Performance Optimizations
- Batching and parallelization for file operations (e.g., uploads/downloads)
- Caching results of expensive/frequent operations
- Debouncing/throttling UI-triggered file operations

### 2. Type Safety & API Improvements
- Stricter types and runtime validation (e.g., with zod/io-ts)
- Consistent return value shapes for all APIs

### 3. Logging & Monitoring
- Centralized logging utility with log levels
- Usage metrics for uploads, downloads, errors, etc.

### 4. Security & Robustness
- Input validation and sanitization
- Access control for all file operations

### 5. Testing
- Unit and integration tests for all modules
- Mock Supabase/storage APIs for logic testing

### 6. Documentation & Examples
- JSDoc comments for all exported functions
- Usage examples in README or code comments

### 7. API Surface Review
- Barrel exports for easier imports
- Deprecate/remove legacy or duplicate functions

> These phases are optional and can be prioritized based on project needs (performance, security, maintainability, etc.). 