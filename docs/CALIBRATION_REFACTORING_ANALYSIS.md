# 📊 CalibrationScaffoldUI Refactoring Analysis

## 🎯 Dependencies Analysis

### **Downstream Dependencies** (What imports CalibrationScaffoldUI)
- ✅ **SAFE**: Only `CalibrationClient.tsx` imports it
- ✅ **INTERFACE**: Simple props `{ projectId: string, userId: string }`
- ✅ **LOW RISK**: Single consumer, well-defined interface

### **Upstream Dependencies** (What CalibrationScaffoldUI imports)
```typescript
// React & UI
import React, { useState, useRef, useEffect } from 'react';
import { Lucide icons... } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { Dialog components... } from './ui/dialog';
import Image from 'next/image';

// Internal Dependencies  
import { supabase } from '../lib/supabaseClient';
import FileManagementPanel from './FileManagementPanel';
import { useProjects } from '@/src/hooks/useProjects';
import { getFilesByType, uploadRawFrame, validateFitsFile } from '@/src/utils/storage';
import { useUserStore } from '@/src/store/user';
import { createBrowserClient } from '@/src/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import CreateSuperdarkUI from './CreateSuperdarkUI';
import { useSuperdarks } from '@/src/hooks/useSuperdarks';
import FrameQualityReport from './FrameQualityReport';
import { HistogramAnalysisReport } from './HistogramAnalysisReport';
```

## 🏗️ Component Structure Analysis

### **State Management Complexity**
- **41 useState hooks** (MASSIVE!)
- **20 useEffect hooks** (COMPLEX lifecycle!)
- **2 useRef hooks**
- **External hooks**: useProjects, useUserStore, useSuperdarks

### **Function Categories**

#### **1. Utility Functions (Safe to extract)**
```typescript
function getProgressMessage(progress: number)                    // Lines 303-327
function groupByMatchingFrames(frames: Array<...>)              // Lines 328-348
```

#### **2. Sub-components (Already defined - safe to extract)**
```typescript
function OutlierReviewTable({...})                              // Lines 349-493
function FrameConsistencyTable({...})                           // Lines 493-652
function HistogramAnalysisSection({ frameType })                // Lines 2137-2228
function CosmeticMethodsSelector({...})                         // Lines 2228+
```

#### **3. API Functions (Safe to extract to services)**
```typescript
async function detectOutliers(fitsPaths, sigmaThresh, frameType) // Lines 979-1037
async function analyzeFrameConsistency(fitsPaths, frameType)     // Lines 1038-1061
```

#### **4. Fetching Functions (Can be extracted to hooks)**
```typescript
async function fetchAllPreviews()                               // Lines 1343-1368
async function fetchAndSetLaCosmicParams()                      // Lines 1400-1441
async function fetchMasterBiases()                              // Lines 1816-1840
async function fetchPreview()                                   // Lines 1946-1990
async function fetchStats()                                     // Lines 1991-2028
```

#### **5. Handler Functions (Component-specific - extract to hooks)**
```typescript
const handleCosmeticMethodToggle                                // Lines 656-691
const handleAutoConsistencyAnalysis                             // Lines 943-978
const handleRunOutlierDetection                                 // Lines 1000-1033
const handleRunConsistencyAnalysis                              // Lines 1062-1101
const handleHistogramAnalysis                                   // Lines 1114-1193
// ... 20+ more handlers
```

## 🚦 Extraction Strategy - Phase 1 (Week 1)

### **Step 1: Extract Utility Functions** (SAFEST)
**Target**: `src/components/calibration/utils/calibrationUtils.ts`
```typescript
export function getProgressMessage(progress: number): string
export function groupByMatchingFrames(frames: FrameData[]): GroupedFrames
```
**Risk**: 🟢 **VERY LOW** - Pure functions, no side effects

### **Step 2: Extract Type Definitions** (SAFEST)  
**Target**: `src/components/calibration/types/calibration.types.ts`
```typescript
export type MasterType = 'dark' | 'flat' | 'bias';
export type MasterStatus = 'complete' | 'in_progress' | 'not_started';
export interface DarkFileWithMetadata { ... }
export interface FileMetadata { ... }
// ... all constants and types
```
**Risk**: 🟢 **VERY LOW** - Just type definitions

### **Step 3: Extract Sub-components** (LOW RISK)
**Targets**: 
- `src/components/calibration/OutlierReviewTable.tsx` 
- `src/components/calibration/FrameConsistencyTable.tsx`
- `src/components/calibration/HistogramAnalysisSection.tsx`

**Process**:
1. Copy function definition to new file
2. Add necessary imports
3. Export as default component
4. Import in CalibrationScaffoldUI
5. Test functionality

**Risk**: 🟡 **LOW** - Well-defined interfaces, no shared state

## 🚦 Extraction Strategy - Phase 2 (Week 2)

### **Step 4: Extract Custom Hooks** (MEDIUM RISK)
**Targets**:
- `src/components/calibration/hooks/useOutlierDetection.ts` (expand existing)
- `src/components/calibration/hooks/useFrameConsistency.ts` (new)
- `src/components/calibration/hooks/useHistogramAnalysis.ts` (new)

**Process**:
1. Group related state and handlers
2. Extract to custom hook
3. Return state and handlers object
4. Import and destructure in main component

**Risk**: 🟡 **MEDIUM** - State dependencies, need careful testing

### **Step 5: Extract API Services** (MEDIUM RISK)
**Target**: `src/components/calibration/services/calibrationAPI.ts`
```typescript
export const outlierDetectionAPI = {
  detectOutliers: async (fitsPaths: string[], sigmaThresh: number, frameType?: string) => { ... }
}
export const frameConsistencyAPI = {
  analyzeFrameConsistency: async (fitsPaths: string[], frameType?: string) => { ... }
}
```

**Risk**: 🟡 **MEDIUM** - API contracts, error handling

## 🎯 Success Metrics - Phase 1

### **Before Phase 1**:
- CalibrationScaffoldUI.tsx: 4,486 lines
- Components extracted: 0
- Custom hooks: 2 (partial)

### **After Phase 1** (Target):
- CalibrationScaffoldUI.tsx: ~3,800 lines (-15%)
- Components extracted: 3
- Utils extracted: 2 functions
- Types extracted: All interfaces/types
- Custom hooks: 2 (complete)

### **After Phase 2** (Target):
- CalibrationScaffoldUI.tsx: ~2,500 lines (-44%)  
- Components extracted: 3
- Custom hooks: 5
- Services: 1
- Risk level: Still manageable

## 🔧 Implementation Order

### **Day 1-2: Foundation**
1. ✅ Extract types to `calibration.types.ts` (**COMPLETED**)
2. ✅ Extract utilities to `calibrationUtils.ts` (**COMPLETED**)
3. ✅ Test imports work correctly (**COMPLETED** - Next.js build passes)

### **Day 3-5: Components**
1. ✅ Extract `OutlierReviewTable`
2. ✅ Extract `FrameConsistencyTable`  
3. ✅ Extract `HistogramAnalysisSection`
4. ✅ Test each component works in isolation

### **Day 6-7: Hooks (Phase 2)**
1. ✅ Complete `useOutlierDetection` hook
2. ✅ Create `useFrameConsistency` hook
3. ✅ Create `useHistogramAnalysis` hook

### **Day 8-10: Services (Phase 2)**
1. ✅ Extract API functions to service layer
2. ✅ Update hooks to use services
3. ✅ End-to-end testing

## 🚨 Risk Mitigation

### **Pre-extraction Checklist**:
- [ ] Create feature branch
- [ ] Run existing tests
- [ ] Take screenshot of working UI
- [ ] Document current behavior

### **Post-extraction Validation**:
- [ ] All imports resolve correctly
- [ ] No TypeScript errors
- [ ] Component renders without crashes  
- [ ] All interactions work as before
- [ ] No console errors

### **Rollback Plan**:
- Keep original file as `.backup`
- Atomic git commits for each extraction
- Test each step before proceeding

---

**Next Step**: Start with **Step 1 (Types)** - safest extraction with highest confidence 