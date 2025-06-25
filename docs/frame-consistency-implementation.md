# Frame-to-Frame Consistency Analysis Implementation

## Overview

The frame-to-frame consistency analysis feature provides advanced quality assessment for calibration frames by analyzing how consistent individual frames are with each other in a dataset. This goes beyond simple outlier detection to provide detailed metrics about frame quality and recommendations for optimal frame selection.

## Features Implemented

### 1. Backend Analysis (`python-worker/app/frame_consistency.py`)

**Core Functionality:**
- **Multi-dimensional Consistency Scoring**: Analyzes frames across multiple metrics
  - Mean consistency (how close frame means are to group median)
  - Standard deviation consistency (noise level comparison)
  - Histogram similarity (distribution shape analysis)
  - Pixel correlation (spatial pattern matching)
  - Outlier deviation (statistical outlier detection)

- **Advanced Statistics**: 
  - Spatial uniformity analysis (quadrant-based)
  - Temporal drift detection (linear trend analysis)
  - Group stability metrics (coefficient of variation)
  - Percentile-based outlier identification

**Data Classes:**
- `FrameConsistencyMetrics`: Individual frame analysis results
- `GroupConsistencyAnalysis`: Overall dataset analysis with recommendations

### 2. API Endpoint (`python-worker/app/main.py`)

**Endpoint:** `POST /frames/consistency`

**Request Parameters:**
```json
{
  "fits_paths": ["list", "of", "filenames"],
  "bucket": "raw-frames",
  "project_id": "project_id",
  "user_id": "user_id", 
  "frame_type": "bias|dark|flat",
  "consistency_threshold": 0.7,
  "sigma_threshold": 2.5,
  "min_frames": 5,
  "max_frames": null
}
```

**Response:**
```json
{
  "success": true,
  "n_frames": 10,
  "overall_consistency": 8.2,
  "mean_stability": 0.045,
  "std_stability": 0.032,
  "temporal_drift": 0.001,
  "recommended_frames": ["file1.fits", "file2.fits"],
  "questionable_frames": ["file3.fits"],
  "rejected_frames": ["file4.fits"],
  "group_statistics": {...},
  "metrics_by_frame": [...],
  "selection_advice": {...}
}
```

### 3. Frontend Integration (`src/components/CalibrationScaffoldUI.tsx`)

**UI Components:**
- **Consistency Analysis Button**: Triggers frame analysis
- **Consistency Score Display**: Shows overall quality (0-10 scale)
- **FrameConsistencyTable**: Detailed results table with:
  - Individual frame scores and metrics
  - Interactive frame selection checkboxes
  - Color-coded quality indicators
  - Detailed warning messages
  - Selection recommendations

**Visual Indicators:**
- 🟢 **Excellent (8.0+)**: High-quality consistent frames
- 🟡 **Good (6.0-7.9)**: Acceptable quality with minor issues  
- 🔴 **Poor (<6.0)**: Problematic frames requiring attention

## Analysis Metrics Explained

### 1. Mean Consistency (30% weight)
Measures how close each frame's mean value is to the group median. Detects:
- Bias level variations
- Exposure differences
- Temperature drift effects

### 2. Standard Deviation Consistency (20% weight)
Compares noise levels between frames. Identifies:
- Variable noise conditions
- Electronic interference
- Cooling system issues

### 3. Histogram Similarity (25% weight)
Analyzes the distribution shape of pixel values. Detects:
- Different exposure conditions
- Non-linear response variations
- Systematic calibration differences

### 4. Pixel Correlation (25% weight)
Measures spatial pattern consistency. Identifies:
- Optical variations
- Dust or contamination changes
- Mechanical flexure

### 5. Outlier Deviation
Statistical measure of how many sigma a frame deviates from the group.

## Quality Assessment Categories

### Recommended Frames
- Consistency score ≥ 7.0/10
- Low deviation from group statistics
- Minimal warnings
- **Action**: Include in stacking

### Questionable Frames  
- Consistency score 3.5-6.9/10
- Moderate deviations or specific issues
- Some warnings present
- **Action**: Review individually, consider excluding

### Rejected Frames
- Consistency score < 3.5/10
- Significant deviations or multiple issues
- Multiple warnings
- **Action**: Exclude from stacking

## Integration with Calibration Workflow

### Where It Fits
1. **After Upload**: User uploads calibration frames
2. **Frame Analysis**: Run consistency analysis before stacking
3. **Review Results**: User reviews recommendations
4. **Frame Selection**: User accepts/modifies frame selection
5. **Master Creation**: Stack only selected frames

### Benefits
- **Improved Quality**: Better master frames through intelligent selection
- **Time Savings**: Automatic identification of problematic frames  
- **Consistency**: Objective quality assessment across projects
- **Learning**: Detailed metrics help users understand their data

## Usage Examples

### Bias Frames
```typescript
// Typical bias consistency results
{
  overall_consistency: 8.5,
  mean_stability: 0.02,    // Very low variation expected
  std_stability: 0.05,     // Consistent noise level
  recommended_frames: 18,  // Most frames should be good
  rejected_frames: 2       // Outliers with electronic issues
}
```

### Dark Frames
```typescript
// Dark frame analysis
{
  overall_consistency: 7.2,
  temporal_drift: 0.003,   // Possible temperature drift
  recommended_frames: 12,
  questionable_frames: 3,  // Frames with hot pixel variations
  rejected_frames: 1       // Frame with cooling failure
}
```

### Flat Frames
```typescript
// Flat field consistency
{
  overall_consistency: 6.8,
  spatial_uniformity: 0.15, // Some illumination variation
  recommended_frames: 8,
  questionable_frames: 4,   // Frames with dust or illumination issues
  rejected_frames: 2        // Severely non-uniform frames
}
```

## Future Enhancements

### Planned Features
1. **Machine Learning**: Automatic quality prediction based on historical data
2. **Advanced Filtering**: Custom quality thresholds per frame type
3. **Batch Processing**: Analyze multiple projects simultaneously
4. **Quality Trends**: Historical quality tracking over time
5. **Equipment Correlation**: Link quality metrics to specific equipment

### Integration Points
- **Automated Workflows**: Trigger consistency analysis automatically
- **Quality Reports**: Generate detailed quality assessment reports  
- **Project Templates**: Save consistency settings as project templates
- **Equipment Profiles**: Customize analysis for specific camera/telescope combinations

## Technical Notes

### Performance Considerations
- **Memory Usage**: Processes frames in chunks for large datasets
- **Computation Time**: ~1-2 seconds per frame for full analysis
- **Storage**: Results cached for subsequent analysis
- **Scalability**: Designed for datasets up to 50+ frames

### Error Handling
- **Missing Files**: Graceful handling of unavailable frames
- **Corrupted Data**: Robust statistics that handle bad pixels
- **Network Issues**: Retry logic for file downloads
- **Memory Limits**: Automatic downsampling for very large frames

This implementation provides a comprehensive frame quality analysis system that helps astrophotographers achieve better calibration results through intelligent frame selection and detailed quality insights. 