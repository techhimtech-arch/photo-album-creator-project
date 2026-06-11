import { create } from "zustand";
import type {
  Album,
  AlbumSizePreset,
  DecorationAsset,
  ImageLayer,
  Layer,
  Page,
  PageBackground,
  PhotoAsset,
  PlaceholderLayer,
} from "@/types/album";
import {
  createImageLayerFromSlot,
  createPlaceholderLayer,
  isPhotoSlot,
  placeholderToImageLayer,
} from "@/lib/slot-layers";
import { ALBUM_PRESETS } from "@/types/album";
import {
  loadAlbum,
  loadDecorations,
  loadPhotos,
  saveAlbum,
  saveDecorations,
  savePhotos,
  loadCustomLayouts,
  saveCustomLayouts,
  loadTemplateLibrary,
  saveTemplateLibrary,
  loadWorkflowMode,
  saveWorkflowMode,
  type WorkflowMode,
} from "@/lib/album-persistence";
import { LAYOUTS, type AlbumLayout } from "@/lib/layouts";
import { inToEditorPx } from "@/lib/units";
import {
  isAlbumTemplate,
  templateToAlbum,
  type AlbumTemplate,
} from "@/lib/album-template";

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultBackground: PageBackground = { kind: "color", color: "#ffffff" };

export function createBlankPage(): Page {
  return { id: uid(), background: { ...defaultBackground }, layers: [] };
}

export function createBlankAlbum(
  preset: AlbumSizePreset = "12x36",
  custom?: { widthIn: number; heightIn: number },
): Album {
  const size =
    preset === "custom" && custom
      ? { widthIn: custom.widthIn, heightIn: custom.heightIn }
      : ALBUM_PRESETS[preset as Exclude<AlbumSizePreset, "custom">];
  return {
    id: uid(),
    name: "Untitled Album",
    widthIn: size.widthIn,
    heightIn: size.heightIn,
    preset,
    dpi: 300,
    pages: [createBlankPage()],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface HistoryEntry {
  album: Album;
}

interface State {
  ready: boolean;
  album: Album;
  activePageId: string;
  selectedLayerIds: string[];
  zoom: number; // 1 = 100%
  fitMode: "fit" | "free";
  photos: PhotoAsset[];
  decorations: DecorationAsset[];
  customLayouts: AlbumLayout[];
  photoSort: "time" | "name";
  showGuides: boolean;
  layoutGap: number;
  history: HistoryEntry[];
  historyIndex: number;
  workflowMode: WorkflowMode;
  templateLibrary: AlbumTemplate[];

  bootstrap: () => Promise<void>;
  setWorkflowMode: (mode: WorkflowMode) => void;
  addToTemplateLibrary: (template: AlbumTemplate) => void;
  removeFromTemplateLibrary: (name: string) => void;
  setAlbum: (updater: (a: Album) => Album, snapshot?: boolean) => void;
  newAlbum: (preset: AlbumSizePreset, custom?: { widthIn: number; heightIn: number }) => void;
  resizeAlbum: (preset: AlbumSizePreset, custom?: { widthIn: number; heightIn: number }) => void;
  renameAlbum: (name: string) => void;

  // Pages
  addPage: () => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  movePage: (from: number, to: number) => void;
  setActivePage: (id: string) => void;
  setPageStatus: (pageId: string, status: "draft" | "done") => void;
  updatePageBackground: (pageId: string, bg: PageBackground) => void;
  updateAllPagesBackground: (bg: PageBackground) => void;

  // Layers
  addLayer: (pageId: string, layer: Layer) => void;
  updateLayer: (pageId: string, layerId: string, patch: Partial<Layer>) => void;
  deleteLayer: (pageId: string, layerId: string) => void;
  reorderLayer: (pageId: string, layerId: string, dir: "front" | "back" | "forward" | "backward") => void;
  setSelected: (ids: string[]) => void;

  // Zoom
  setZoom: (z: number) => void;
  setFitMode: (m: "fit" | "free") => void;

  // Photos / decorations
  addPhotos: (p: PhotoAsset[]) => void;
  removePhoto: (id: string) => void;
  addDecorations: (d: DecorationAsset[]) => void;
  removeDecoration: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Features
  applyLayoutToPage: (pageId: string, layout: AlbumLayout) => void;
  fillPlaceholder: (pageId: string, placeholderId: string, photo: PhotoAsset) => void;
  fillAllPlaceholders: () => { filled: number; emptyLeft: number; photosLeft: number };
  applyAlbumTemplate: (template: AlbumTemplate) => void;
  autoFillAlbum: (photosToFill: PhotoAsset[]) => void;
  savePageAsLayout: (pageId: string, name: string) => void;
  addCustomLayout: (layout: AlbumLayout) => void;
  deleteCustomLayout: (layoutId: string) => void;
  setPhotoSort: (sort: "time" | "name") => void;
  toggleGuides: () => void;
  setLayoutGap: (gap: number) => void;
}

const HISTORY_LIMIT = 50;

export const useAlbumStore = create<State>((set, get) => ({
  ready: false,
  album: createBlankAlbum(),
  activePageId: "",
  selectedLayerIds: [],
  zoom: 1,
  fitMode: "fit",
  photos: [],
  decorations: [],
  customLayouts: [],
  photoSort: "time",
  showGuides: false,
  layoutGap: 16,
  history: [],
  historyIndex: -1,
  workflowMode: "producer",
  templateLibrary: [],

  bootstrap: async () => {
    const [album, photos, decorations, layouts, templates, workflowMode] = await Promise.all([
      loadAlbum(),
      loadPhotos(),
      loadDecorations(),
      loadCustomLayouts(),
      loadTemplateLibrary(),
      loadWorkflowMode(),
    ]);
    const a = album ?? createBlankAlbum();
    set({
      album: a,
      activePageId: a.pages[0]?.id ?? "",
      photos,
      decorations,
      customLayouts: layouts,
      templateLibrary: templates,
      workflowMode,
      ready: true,
      history: [{ album: a }],
      historyIndex: 0,
    });
  },

  setWorkflowMode: (mode) => {
    set({ workflowMode: mode });
    void saveWorkflowMode(mode);
  },

  addToTemplateLibrary: (template) => {
    const lib = get().templateLibrary.filter((t) => t.name !== template.name);
    set({ templateLibrary: [...lib, template] });
  },

  removeFromTemplateLibrary: (name) => {
    set({ templateLibrary: get().templateLibrary.filter((t) => t.name !== name) });
  },

  setAlbum: (updater, snapshot = true) => {
    const prev = get().album;
    const next = { ...updater(prev), updatedAt: Date.now() };
    set({ album: next });
    if (snapshot) pushHistory(set, get, next);
  },

  newAlbum: (preset, custom) => {
    const a = createBlankAlbum(preset, custom);
    set({
      album: a,
      activePageId: a.pages[0].id,
      selectedLayerIds: [],
      history: [{ album: a }],
      historyIndex: 0,
    });
  },

  resizeAlbum: (preset, custom) => {
    get().setAlbum((a) => {
      const size =
        preset === "custom" && custom
          ? { widthIn: custom.widthIn, heightIn: custom.heightIn }
          : ALBUM_PRESETS[preset as Exclude<AlbumSizePreset, "custom">];
      return { ...a, preset, widthIn: size.widthIn, heightIn: size.heightIn };
    });
  },

  renameAlbum: (name) => get().setAlbum((a) => ({ ...a, name }), false),

  addPage: () => {
    const page = createBlankPage();
    get().setAlbum((a) => ({ ...a, pages: [...a.pages, page] }));
    set({ activePageId: page.id });
  },
  duplicatePage: (pageId) => {
    const original = get().album.pages.find((p) => p.id === pageId);
    if (!original) return;
    const copy: Page = {
      ...original,
      id: uid(),
      layers: original.layers.map((l) => ({ ...l, id: uid() })),
    };
    get().setAlbum((a) => {
      const idx = a.pages.findIndex((p) => p.id === pageId);
      const next = a.pages.slice();
      next.splice(idx + 1, 0, copy);
      return { ...a, pages: next };
    });
    set({ activePageId: copy.id });
  },
  deletePage: (pageId) => {
    const pages = get().album.pages;
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === pageId);
    get().setAlbum((a) => ({ ...a, pages: a.pages.filter((p) => p.id !== pageId) }));
    const remaining = get().album.pages;
    set({ activePageId: remaining[Math.max(0, idx - 1)].id });
  },
  movePage: (from, to) => {
    get().setAlbum((a) => {
      const next = a.pages.slice();
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return { ...a, pages: next };
    });
  },
  setActivePage: (id) => set({ activePageId: id, selectedLayerIds: [] }),

  setPageStatus: (pageId, status) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => (p.id === pageId ? { ...p, status } : p)),
    }));
  },

  updatePageBackground: (pageId, bg) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => (p.id === pageId ? { ...p, background: bg } : p)),
    }));
  },
  
  updateAllPagesBackground: (bg) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => ({ ...p, background: bg })),
    }));
  },

  addLayer: (pageId, layer) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) =>
        p.id === pageId ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    }));
    set({ selectedLayerIds: [layer.id] });
  },
  updateLayer: (pageId, layerId, patch) => {
    get().setAlbum(
      (a) => ({
        ...a,
        pages: a.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                layers: p.layers.map((l) =>
                  l.id === layerId ? ({ ...l, ...patch } as Layer) : l,
                ),
              }
            : p,
        ),
      }),
      false,
    );
  },
  deleteLayer: (pageId, layerId) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) =>
        p.id === pageId ? { ...p, layers: p.layers.filter((l) => l.id !== layerId) } : p,
      ),
    }));
    set({ selectedLayerIds: get().selectedLayerIds.filter((id) => id !== layerId) });
  },
  reorderLayer: (pageId, layerId, dir) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => {
        if (p.id !== pageId) return p;
        const layers = p.layers.slice();
        const i = layers.findIndex((l) => l.id === layerId);
        if (i < 0) return p;
        const [m] = layers.splice(i, 1);
        if (dir === "front") layers.push(m);
        else if (dir === "back") layers.unshift(m);
        else if (dir === "forward") layers.splice(Math.min(layers.length, i + 1), 0, m);
        else layers.splice(Math.max(0, i - 1), 0, m);
        return { ...p, layers };
      }),
    }));
  },
  setSelected: (ids) => set({ selectedLayerIds: ids }),

  setZoom: (z) => set({ zoom: Math.max(0.05, Math.min(5, z)), fitMode: "free" }),
  setFitMode: (m) => set({ fitMode: m }),

  addPhotos: (p) => set({ photos: [...get().photos, ...p] }),
  removePhoto: (id) => set({ photos: get().photos.filter((p) => p.id !== id) }),
  addDecorations: (d) => set({ decorations: [...get().decorations, ...d] }),
  removeDecoration: (id) =>
    set({ decorations: get().decorations.filter((d) => d.id !== id) }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const i = historyIndex - 1;
    set({ historyIndex: i, album: history[i].album, selectedLayerIds: [] });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const i = historyIndex + 1;
    set({ historyIndex: i, album: history[i].album, selectedLayerIds: [] });
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  applyLayoutToPage: (pageId, layout) => {
    get().setAlbum((a) => {
      const pageIndex = a.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return a;
      const page = a.pages[pageIndex];

      const pageWpx = inToEditorPx(a.widthIn);
      const pageHpx = inToEditorPx(a.heightIn);
      const gap = get().layoutGap || 0;

      const existingSlots = page.layers.filter(isPhotoSlot);
      const otherLayers = page.layers.filter((l) => !isPhotoSlot(l) && !l.isTemplate);

      const availablePhotos = get().photos;
      const usedSrcs = new Set<string>();
      a.pages.forEach((p) =>
        p.layers.forEach((l) => {
          if (l.type === "image") usedSrcs.add(l.src);
        }),
      );
      const unusedPhotos = [...availablePhotos.filter((p) => !usedSrcs.has(p.src))];

      const newLayers: Layer[] = [...otherLayers];

      layout.slots.forEach((slot, i) => {
        const existing = existingSlots[i];

        if (existing?.type === "image") {
          newLayers.push(
            createImageLayerFromSlot(slot, pageWpx, pageHpx, gap, {
              id: existing.id,
              name: existing.name,
              src: existing.src,
              width: existing.naturalWidth,
              height: existing.naturalHeight,
              addedAt: 0,
            }, existing),
          );
          return;
        }

        if (existing?.type === "placeholder") {
          newLayers.push(createPlaceholderLayer(slot, pageWpx, pageHpx, gap, i, existing));
          return;
        }

        if (unusedPhotos.length > 0) {
          const nextPhoto = unusedPhotos.shift()!;
          newLayers.push(createImageLayerFromSlot(slot, pageWpx, pageHpx, gap, nextPhoto));
          return;
        }

        if (availablePhotos.length > 0) {
          const fallback = availablePhotos[i % availablePhotos.length];
          newLayers.push(createImageLayerFromSlot(slot, pageWpx, pageHpx, gap, fallback));
          return;
        }

        newLayers.push(createPlaceholderLayer(slot, pageWpx, pageHpx, gap, i));
      });

      if (layout.elements) {
        layout.elements.forEach((el) => {
          const { rx, ry, rw, rh, ...rest } = el as any;
          newLayers.push({
            ...rest,
            id: uid(),
            x: rx * pageWpx,
            y: ry * pageHpx,
            width: rw * pageWpx,
            height: rh * pageHpx,
            isTemplate: true,
          } as Layer);
        });
      }

      const nextPages = [...a.pages];
      const newPage = { ...page, layers: newLayers };
      if (layout.background) {
        newPage.background = layout.background;
      }
      nextPages[pageIndex] = newPage;
      return { ...a, pages: nextPages };
    });
  },

  fillPlaceholder: (pageId, placeholderId, photo) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => {
        if (p.id !== pageId) return p;
        const idx = p.layers.findIndex((l) => l.id === placeholderId);
        if (idx === -1) return p;
        const layer = p.layers[idx];
        if (layer.type !== "placeholder") return p;
        const layers = p.layers.slice();
        layers[idx] = placeholderToImageLayer(layer as PlaceholderLayer, photo);
        return { ...p, layers };
      }),
    }));
    set({ selectedLayerIds: [placeholderId] });
  },

  fillAllPlaceholders: () => {
    const { album, photos, photoSort } = get();
    const emptyBefore = album.pages.reduce(
      (n, p) => n + p.layers.filter((l) => l.type === "placeholder").length,
      0,
    );

    const usedSrcs = new Set<string>();
    album.pages.forEach((p) =>
      p.layers.forEach((l) => {
        if (l.type === "image") usedSrcs.add(l.src);
      }),
    );

    const queue = [...photos]
      .filter((p) => !usedSrcs.has(p.src))
      .sort((a, b) =>
        photoSort === "name" ? a.name.localeCompare(b.name) : a.addedAt - b.addedAt,
      );

    let photoIdx = 0;
    let filled = 0;

    get().setAlbum((a) => {
      const pages = a.pages.map((p) => {
        let changed = false;
        const layers = p.layers.map((l) => {
          if (l.type !== "placeholder" || photoIdx >= queue.length) return l;
          const next = placeholderToImageLayer(l, queue[photoIdx++]);
          filled++;
          changed = true;
          return next;
        });
        return changed ? { ...p, layers } : p;
      });
      return { ...a, pages };
    });

    return {
      filled,
      emptyLeft: Math.max(0, emptyBefore - filled),
      photosLeft: Math.max(0, queue.length - filled),
    };
  },

  applyAlbumTemplate: (template) => {
    if (!isAlbumTemplate(template)) return;
    const a = templateToAlbum(template);
    set({
      album: a,
      activePageId: a.pages[0]?.id ?? "",
      selectedLayerIds: [],
      photos: [],
      history: [{ album: a }],
      historyIndex: 0,
    });
  },

  autoFillAlbum: (photosToFill) => {
    if (photosToFill.length === 0) return;

    get().setAlbum((a) => {
      const pageWpx = inToEditorPx(a.widthIn);
      const pageHpx = inToEditorPx(a.heightIn);

      const newPages: Page[] = [];
      let i = 0;

      const ALL_LAYOUTS = [...LAYOUTS, ...get().customLayouts];

      while (i < photosToFill.length) {
        const remaining = photosToFill.length - i;
        let chunkSize = Math.floor(Math.random() * 4) + 3; // 3 to 6
        if (remaining < 3) chunkSize = remaining;
        if (chunkSize > remaining) chunkSize = remaining;

        const chunk = photosToFill.slice(i, i + chunkSize);
        i += chunkSize;

        const categoryStr = chunkSize.toString();
        const validLayouts = ALL_LAYOUTS.filter((l) => l.category === categoryStr);
        let layout = validLayouts[Math.floor(Math.random() * validLayouts.length)];
        if (!layout && ALL_LAYOUTS.length > 0) {
          layout = ALL_LAYOUTS[0];
        }

        const page = createBlankPage();
        const gap = get().layoutGap || 0;

        if (layout) {
          const layers: Layer[] = chunk.map((photo, idx) => {
            const slot = layout.slots[idx % layout.slots.length];
            const sw = slot.w * pageWpx;
            const sh = slot.h * pageHpx;
            const sx = slot.x * pageWpx;
            const sy = slot.y * pageHpx;
      
            const fw = Math.max(10, sw - gap);
            const fh = Math.max(10, sh - gap);
            const fx = sx + gap / 2;
            const fy = sy + gap / 2;

            return {
              id: uid(),
              name: photo.name,
              type: "image",
              src: photo.src,
              naturalWidth: photo.width,
              naturalHeight: photo.height,
              x: fx,
              y: fy,
              width: fw,
              height: fh,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
              mask: "none",
              cornerRadius: 12,
              flipH: false,
              flipV: false,
              border: { width: 4, color: "#ffffff" },
            };
          });

          if (layout.elements) {
            layout.elements.forEach((el) => {
              const { rx, ry, rw, rh, ...rest } = el as any;
              layers.push({
                ...rest,
                id: uid(),
                x: rx * pageWpx,
                y: ry * pageHpx,
                width: rw * pageWpx,
                height: rh * pageHpx,
                isTemplate: true,
              } as Layer);
            });
          }

          page.layers = layers;
          if (layout.background) {
            page.background = layout.background;
          }
        }
        newPages.push(page);
      }

      return { ...a, pages: [...a.pages, ...newPages] };
    });
    set((s) => ({ activePageId: s.album.pages[s.album.pages.length - 1]?.id || s.activePageId }));
  },

  savePageAsLayout: (pageId, name) => {
    const { album, customLayouts } = get();
    const page = album.pages.find((p) => p.id === pageId);
    if (!page) return;

    const slots_layers = page.layers.filter(isPhotoSlot);
    if (slots_layers.length === 0) return;

    const pageWpx = inToEditorPx(album.widthIn);
    const pageHpx = inToEditorPx(album.heightIn);

    const slots = slots_layers.map((img) => ({
      x: img.x / pageWpx,
      y: img.y / pageHpx,
      w: img.width / pageWpx,
      h: img.height / pageHpx,
    }));

    let category = slots_layers.length.toString() as AlbumLayout["category"];
    if (slots_layers.length > 6) category = "collage";

    const elements = page.layers
      .filter((l) => l.type === "text" || l.type === "decoration")
      .map((l) => {
        const { id, x, y, width, height, ...rest } = l as any;
        return {
          ...rest,
          rx: l.x / pageWpx,
          ry: l.y / pageHpx,
          rw: l.width / pageWpx,
          rh: l.height / pageHpx,
        };
      });

    const layout: AlbumLayout = {
      id: `custom-${uid()}`,
      name: name || `Custom Layout (${slots_layers.length} slots)`,
      category,
      slots,
      elements: elements.length > 0 ? elements : undefined,
      background: page.background,
    };

    set({ customLayouts: [...customLayouts, layout] });
  },

  addCustomLayout: (layout) => set({ customLayouts: [...get().customLayouts, layout] }),
  deleteCustomLayout: (id) => set({ customLayouts: get().customLayouts.filter((l) => l.id !== id) }),

  setPhotoSort: (sort) => set({ photoSort: sort }),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setLayoutGap: (gap) => set({ layoutGap: gap }),
}));

function pushHistory(
  set: (partial: Partial<State>) => void,
  get: () => State,
  album: Album,
) {
  const { history, historyIndex } = get();
  const trimmed = history.slice(0, historyIndex + 1);
  trimmed.push({ album });
  while (trimmed.length > HISTORY_LIMIT) trimmed.shift();
  set({ history: trimmed, historyIndex: trimmed.length - 1 });
}

// Auto-persist (debounced)
let albumTimer: ReturnType<typeof setTimeout> | null = null;
let photoTimer: ReturnType<typeof setTimeout> | null = null;
let decorTimer: ReturnType<typeof setTimeout> | null = null;
let layoutsTimer: ReturnType<typeof setTimeout> | null = null;
let lastAlbum: Album | null = null;
let lastPhotos: PhotoAsset[] | null = null;
let lastDecor: DecorationAsset[] | null = null;
let lastLayouts: AlbumLayout[] | null = null;
let lastTemplateLib: AlbumTemplate[] | null = null;

useAlbumStore.subscribe((s) => {
  if (!s.ready) return;
  if (s.album !== lastAlbum) {
    lastAlbum = s.album;
    if (albumTimer) clearTimeout(albumTimer);
    albumTimer = setTimeout(() => void saveAlbum(s.album), 500);
  }
  if (s.photos !== lastPhotos) {
    lastPhotos = s.photos;
    if (photoTimer) clearTimeout(photoTimer);
    photoTimer = setTimeout(() => void savePhotos(s.photos), 500);
  }
  if (s.decorations !== lastDecor) {
    lastDecor = s.decorations;
    if (decorTimer) clearTimeout(decorTimer);
    decorTimer = setTimeout(() => void saveDecorations(s.decorations), 500);
  }
  if (s.customLayouts !== lastLayouts) {
    lastLayouts = s.customLayouts;
    if (layoutsTimer) clearTimeout(layoutsTimer);
    layoutsTimer = setTimeout(() => void saveCustomLayouts(s.customLayouts), 500);
  }
  if (s.templateLibrary !== lastTemplateLib) {
    lastTemplateLib = s.templateLibrary;
    if (layoutsTimer) clearTimeout(layoutsTimer);
    layoutsTimer = setTimeout(() => void saveTemplateLibrary(s.templateLibrary), 500);
  }
});
