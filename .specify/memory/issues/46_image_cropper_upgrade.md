# Slice 10: Image Cropper Upgrade (react-easy-crop)

## Parent

PRD-v2-backlog-overhaul (Item 6)

## What to build

Replace the custom HTML5 Canvas slider-based image cropper with `react-easy-crop` for a premium, mobile-first cropping experience, and ensure the cropper is available in both creation and editing flows.

1. **Install `react-easy-crop`**: Add the dependency to the web app.
2. **Replace the custom cropper**: Remove the zoom/xOffset/yOffset range sliders and the custom canvas rendering. Replace with `react-easy-crop`'s drag-to-pan and pinch-to-zoom interface, enforcing a 4:3 aspect ratio.
3. **Larger preview**: Ensure the crop area is prominently sized (not the current small thumbnail).
4. **Edit flow parity**: The announcement edit form currently allows image replacement but does NOT expose the cropper. After replacing an image on the edit form, the same `react-easy-crop` experience must be available.
5. **Remove orphan code**: Delete the custom `cropper.ts` utility and any related helper functions.

## Acceptance criteria

- [x] `react-easy-crop` is installed and integrated
- [x] Custom slider-based cropper code is removed (including `cropper.ts` utility)
- [x] Cropper enforces 4:3 aspect ratio
- [x] Drag-to-pan and pinch-to-zoom gestures work on both desktop and mobile
- [x] Crop preview is prominently sized
- [x] Cropper is available in both the announcement creation form and the announcement edit form
- [x] Output crop data is correctly sent to the backend for image processing

## Blocked by

- #40 (Panel Sidebar Navigation)
