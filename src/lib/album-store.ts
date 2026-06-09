import { create } from "zustand";
import type {
  Album,
  AlbumSizePreset,
  DecorationAsset,
  Layer,
  Page,
  PageBackground,
  PhotoAsset,
} from "@/types/album";
import { ALBUM_PRESETS } from "@/types/album";
import {
  loadAlbum,
  loadDecorations,
  loadPhotos,
  saveAlbum,
  saveDecorations,
  savePhotos,
} from "@/lib/album-persistence";

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
  history: HistoryEntry[];
  historyIndex: number;

  bootstrap: () => Promise<void>;
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
  updatePageBackground: (pageId: string, bg: PageBackground) => void;

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
  history: [],
  historyIndex: -1,

  bootstrap: async () => {
    const [album, photos, decorations] = await Promise.all([
      loadAlbum(),
      loadPhotos(),
      loadDecorations(),
    ]);
    const a = album ?? createBlankAlbum();
    set({
      album: a,
      activePageId: a.pages[0]?.id ?? "",
      photos,
      decorations,
      ready: true,
      history: [{ album: a }],
      historyIndex: 0,
    });
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

  updatePageBackground: (pageId, bg) => {
    get().setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) => (p.id === pageId ? { ...p, background: bg } : p)),
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
let lastAlbum: Album | null = null;
let lastPhotos: PhotoAsset[] | null = null;
let lastDecor: DecorationAsset[] | null = null;
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
});
