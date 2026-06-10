# Photo Album Creator - Feature Documentation

This document maintains a living record of the features implemented in this application to ensure all contributors (including other AI agents) are aware of the existing capabilities and architecture.

## Core Features

1. **Canvas Engine**: Built on `react-konva`. Supports rendering pages, dragging/dropping layers, panning, zooming, and snapping to guides.
2. **State Management**: Uses `zustand` (`src/lib/album-store.ts`). Handles full album state, history (undo/redo), and auto-saving to IndexedDB.
3. **Dynamic Layouts**: Predefined layout grids (`src/lib/layouts.ts`) that automatically map photos to slots (`applyLayoutToPage`).

## Advanced Professional Features

### Theme Layouts & Custom Layouts
- **Feature**: Users can design a page and click "Save Page" in the Layouts panel.
- **Mechanism**: The system saves photo slots, text elements, decoration elements (cliparts), and the page background into a JSON structure (`AlbumLayout`).
- **Reuse**: When this saved layout is applied to a new page, it restores the complete theme perfectly. Text and decorations are mapped with relative coordinates (`rx, ry`) to support different aspect ratios.

### Smart Auto-Fill
- **Feature**: A "Smart Auto-Fill" button automatically generates pages to fit a queue of photos.
- **Mechanism**: It selects random layouts appropriate for chunk sizes (e.g., 3-6 photos per page) and populates the canvas automatically.

### Photo Queue (Used vs Unused)
- **Feature**: The Photo Gallery automatically calculates which photos are currently used on any page and filters them out of the "Unused" queue.
- **Mechanism**: Dynamic filtering based on matching `photo.src` with existing `ImageLayer.src` across all album pages.

### Page Status Marking
- **Feature**: Users can mark pages as "Done" to track their progress systematically.
- **Mechanism**: A `status: "draft" | "done"` field on the `Page` interface. Visualized with a green checkmark in the sidebar.

### Instant Layout Shuffling
- **Feature**: Pressing `Spacebar` while a page is active will instantly cycle through all layouts that match the number of photos currently on the page.
- **Mechanism**: Keyboard event listener intercepts spacebar, finds the next layout in `LAYOUTS` with the same `category`, and triggers `applyLayoutToPage`.

### Non-Destructive Image Adjustments
- **Feature**: Filters (brightness, contrast, blur, sepia, grayscale), drop shadows, and masks (heart, circle, star, etc.) can be applied to photos.
- **Mechanism**: Implemented in `ImageLayerNode.tsx` using Konva's built-in filters and clipping functions (`clipFunc`).

*Updated: 2026-06-10*
