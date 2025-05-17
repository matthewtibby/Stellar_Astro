# 🌟 Stellar Astro Calibration: User Guide

Welcome to Stellar Astro's Calibration system! This guide explains what you can do for each calibration frame type, what options are available in beginner and advanced modes, and tips for getting the best results.

---

## 📸 Calibration Frame Types & What You Can Do

### 1. **Master Dark**
- **Purpose:** Removes thermal noise and hot pixels from your light frames.
- **Beginner Mode:**
  - Choose stacking method: **Median** (default, robust to outliers) or **Mean** (improves SNR, less robust to outliers).
- **Advanced Mode:**
  - Stacking method: Median, Mean, Winsorized Sigma Clipping, Linear Fit Clipping
  - Sigma/Kappa threshold (for outlier rejection methods)
  - Dark frame scaling (enable/disable, set scaling factor)
  - Bias subtraction (enable/disable)
  - Amp glow suppression (enable/disable)
  - Temperature matching (enable/disable)
  - Exposure time matching (enable/disable)
  - Cosmetic correction (enable/disable, choose method, set threshold)
  - Custom rejection expression (for expert users)
- **Tips:**
  - Use darks that match your lights in exposure, temperature, and ISO/gain for best results.
  - Enable advanced options only if you know your data needs them.

### 2. **Master Flat**
- **Purpose:** Corrects for vignetting, dust, and optical artifacts in your images.
- **Beginner Mode:**
  - Choose stacking method: **Mean**, **Median**, or **Min/Max Rejection**
- **Advanced Mode:**
  - Stacking method: Sigma Clipping, Winsorized Sigma Clipping, Linear Fit Clipping, Adaptive Weighted Average, Entropy Weighted Average
  - Sigma/Kappa threshold (for relevant methods)
  - Weight parameter (for weighted methods)
  - Cosmetic correction (enable/disable, choose method, set threshold)
  - Custom rejection expression
- **Tips:**
  - Take flats with the same optical setup as your lights (focus, filters, camera orientation).
  - Use Min/Max or Sigma Clipping if you have dust motes or outliers.

### 3. **Master Bias**
- **Purpose:** Removes electronic read noise from your images.
- **Beginner Mode:**
  - Stacking method: **Median** (default)
- **Advanced Mode:**
  - Stacking method: Median, Sigma Clipping, Winsorized Sigma Clipping, Linear Fit Clipping
  - Sigma/Kappa threshold (for relevant methods)
  - Cosmetic correction (enable/disable, choose method, set threshold)
  - Custom rejection expression
- **Tips:**
  - Bias frames should be the shortest possible exposure with the lens/cap on.
  - Median stacking is usually sufficient for bias frames.

---

## 🧑‍💻 General Calibration Tips
- **Beginner Mode:**
  - Designed for simplicity and best practices. Most users will get great results with default settings.
- **Advanced Mode:**
  - Unlocks expert controls for power users. Only change advanced settings if you understand their impact.
- **Tooltips:**
  - Hover over info icons in the UI for detailed explanations of each option.
- **Diagnostics:**
  - After calibration, review histograms and diagnostics to check for issues (e.g., outliers, amp glow, uneven flats).
- **Reproducibility:**
  - All calibration steps and settings are logged for traceability. You can download reports for your records.

---

## 📝 Additional Details
- **Supported File Types:** FITS, DSLR RAW, TIFF (see upload UI for full list)
- **Metadata:** Enter accurate camera, exposure, ISO/gain, temperature, and filter info for best matching and results.
- **Master Frame Library:** Reuse master frames across projects if metadata matches.
- **Help & Onboarding:** Use the built-in glossary and walkthroughs for guidance.
- **Accessibility:** All features are keyboard accessible and mobile-friendly.

---

For more details, see the full documentation or contact support! 