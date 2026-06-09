# Wedding Album Designer — Phase 1 Plan

Browser-only, Photoshop-style wedding album editor. ID Card Studio code ko hata ke fresh start. Sab kuch IndexedDB mein store hoga, no backend.

## Engine choice: Konva.js + react-konva

Reasons: React-native bindings (declarative scene graph instead of imperative Fabric API), better layer/z-index handling for a Photoshop-like layers panel, faster with many images, native transformer (resize+rotate handles), built-in hit detection for masks. Fabric is fine but Konva fits a multi-layer album editor better.

## Phase 1 scope (sab 4 chuna gaya — realistic chunks mein break karenge)

### Sprint 1 — Foundation & Core editor
- Replace `src/pages/Index.tsx` with new `AlbumEditor` shell. Remove ID card components/routes.
- Album state via Zustand (`src/lib/album-store.ts`):
  - `album`: id, name, size (preset or custom inches), dpi (default 300)
  - `pages[]`: each with `background`, `layers[]`
  - `activePageId`, `selectedLayerIds`, `zoom`, `tool`
- IndexedDB persistence via `idb-keyval` (already in deps). Auto-save debounced.
- Layout shell:
  - Top toolbar: album name, size selector, zoom %, fullscreen, export, undo/redo
  - Left sidebar: page thumbnails (drag-reorder, add, duplicate, delete)
  - Center: Konva Stage scaled to fit viewport, with ruler/canvas background
  - Right sidebar: contextual panel (properties of selected layer OR page background)
- Album sizes: 12x36, 12x24, 12x30, custom (inches → pixels at 300 DPI internally)
- Fullscreen mode via Fullscreen API
- Undo/redo: snapshot-based history per album

### Sprint 2 — Photos & layouts
- Photo gallery panel (right-side tab): drag/drop upload, bulk upload, folder upload (`webkitdirectory`), thumbnails stored as data URLs in IndexedDB
- Drag photo from gallery onto canvas → creates ImageLayer
- ImageLayer features via Konva.Transformer + custom controls:
  - Move, resize (corner+side handles), rotate, flip H/V
  - Opacity slider, border (width+color), drop shadow
  - Crop (modal with crop rectangle inside source image)
  - Mask: rectangle / rounded / circle / heart (SVG clip path → Konva clip func)
- Layout library (`src/lib/layouts.ts`): JSON definitions of 1/2/3/4/5/6 photo grid + collage variants, each with relative photo slot rects
- "Apply layout" button: takes selected layout + N selected gallery photos → creates layers on active page
- Auto-arrange: selects N photos, picks best layout, fills slots

### Sprint 3 — Backgrounds & decorations
- Page background panel:
  - Solid color, linear/radial gradient (2-stop with picker), uploaded image, image fit modes (cover/contain/tile)
- Decoration system: same as ImageLayer but flagged `type: "decoration"`, with default blend modes. Upload PNG overlays. User-uploaded library stored in IndexedDB.
- Overlay/light-leak support via Konva `globalCompositeOperation` (screen, multiply, overlay)

### Sprint 4 — Text, layers panel, export
- TextLayer: Konva.Text + Konva.TextPath (for curved text)
  - Font family (Google Fonts loader for ~20 wedding-friendly fonts), size, color, stroke, shadow, letter spacing, alignment
- Layers panel (right-side tab):
  - Ordered list of layers on active page (top = front)
  - Per-layer: visibility toggle, lock toggle, rename, delete
  - Bring forward / send backward / front / back buttons + drag-reorder
- Export pipeline:
  - Per-page: render Konva stage at full target pixel size (size_inches × 300) to canvas
  - PNG / JPG via `stage.toDataURL`
  - PDF via `jsPDF` (already in deps): add each page as image at exact inch dimensions
  - CMYK-safe note: true CMYK conversion isn't possible in-browser; expose "CMYK-safe palette" toggle that warns on out-of-gamut colors and avoids pure RGB primaries (document this honestly in UI)
  - Page-by-page export or full album

## Out of scope for Phase 1 (Phase 2+)
- Brush masks, artistic masks beyond presets
- Save custom layouts to library
- Smart "auto-generate full album from N photos"
- AI features, cloud storage, PSD import, shared client selection
- Built-in background/decoration library (you'll upload your own)

## Technical architecture

```text
src/
  pages/
    Index.tsx                  # AlbumEditor shell
  components/album/
    Toolbar.tsx
    PageSidebar.tsx            # thumbnails
    EditorCanvas.tsx           # Konva Stage + Layers
    RightPanel.tsx             # tabs: Properties | Photos | Layers | Background | Text | Decorations
    panels/
      PropertiesPanel.tsx
      PhotoGalleryPanel.tsx
      LayersPanel.tsx
      BackgroundPanel.tsx
      TextPanel.tsx
      DecorationsPanel.tsx
    layers/
      ImageLayerNode.tsx
      TextLayerNode.tsx
      DecorationLayerNode.tsx
    dialogs/
      CropDialog.tsx
      ExportDialog.tsx
      NewAlbumDialog.tsx
  lib/
    album-store.ts             # zustand + history
    album-persistence.ts       # idb-keyval
    layouts.ts                 # built-in layout JSON
    masks.ts                   # mask shape generators
    export.ts                  # PNG/JPG/PDF pipeline
    units.ts                   # inches <-> px @ DPI
  types/album.ts
```

### Data model (TypeScript sketch)
```ts
type LayerBase = { id; type; x; y; width; height; rotation; opacity; locked; visible; zIndex };
type ImageLayer  = LayerBase & { type:"image"; src; crop?; mask?; flipH; flipV; border?; shadow? };
type TextLayer   = LayerBase & { type:"text"; text; font; size; color; stroke?; shadow?; spacing; curve? };
type DecorLayer  = LayerBase & { type:"decoration"; src; blendMode? };
type PageBg      = { kind:"color"|"gradient"|"image"; ... };
type Page        = { id; background:PageBg; layers:Layer[] };
type Album       = { id; name; widthIn; heightIn; dpi; pages:Page[] };
```

### Dependencies to add
- `konva`, `react-konva` (canvas engine)
- `webfontloader` (Google Fonts on demand)
- Already present: `jspdf`, `idb-keyval`, `zustand`, shadcn UI, tailwind

## Code to remove
All `src/components/idcard/*`, `src/lib/idcard-store.ts`, `cardDraw.ts`, `format-date.ts`, `bg-eraser.ts`, `bg-fit.ts`, `auto-fit.ts`, `template-to-custom.ts`, `src/types/idcard.ts`. Keep shadcn UI, hooks, generic utils.

## Risks / honest notes
- 300 DPI export of a 12×36 inch page = 3600×10800 px canvas. Exporting many such pages can OOM mobile browsers. Solution: render off-screen one page at a time, free memory between, show progress.
- True CMYK PDF requires a server. Phase 1 will produce RGB PDF with CMYK-safe color warnings only.
- Folder upload depends on `webkitdirectory` (Chromium/Safari only — Firefox falls back to multi-file).

## Delivery order
1. Sprint 1 — usable empty editor with pages, zoom, save/load
2. Sprint 2 — add photos and apply layouts (first "wow" moment)
3. Sprint 3 — backgrounds and decorations
4. Sprint 4 — text, layers panel, export

Each sprint ends with a working preview. Aap har sprint ke baad test kar sakte ho aur priorities shift kar sakte ho.
