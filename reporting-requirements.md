# 📊 ProjectCard Fallback Tagging & Reporting Requirements

## Overview
To enable robust reporting and investigation of incomplete or placeholder data in the dashboard, each `ProjectCard` now:
- Collects the names of fields using fallback values (e.g., missing target name, frame count, file size, etc.)
- Renders a visible badge (⚠️ Fallback) on the card if any fallbacks are present
- Adds a `data-fallbacks` attribute to the card root, listing all fields using fallbacks (comma-separated)

---

## How It Works
- **Fallback Detection:**
  - When rendering, the card checks each critical field (targetName, frameCount, fileSize, creationDate, updatedAt, equipment, status, displayImage).
  - If a field is missing or uses a default, its name is added to a `dataFallbacks` array.
- **UI Tagging:**
  - If any fallbacks are present, a yellow badge appears in the card's top-left corner: `⚠️ Fallback` (with a tooltip listing the fields).
  - The card's root element includes a `data-fallbacks` attribute, e.g.:
    ```html
    <div data-fallbacks="targetName,fileSize,equipment">...</div>
    ```

## Example
```jsx
<ProjectCard ... data-fallbacks="targetName,fileSize" />
```

## Future Reporting Requirements
- [ ] Script or tool to scan the DOM for all cards with `data-fallbacks` present
- [ ] Aggregate and export a report of which fields are most commonly missing
- [ ] Optionally, log fallback events to analytics for proactive QA
- [ ] Add admin dashboard view for investigating fallback-heavy projects

## Why This Matters
- Ensures no silent data quality issues in production
- Enables targeted investigation and schema improvements
- Supports continuous improvement of data completeness and user experience

---
*Update this file as reporting requirements evolve or new fallback fields are added to ProjectCard.* 