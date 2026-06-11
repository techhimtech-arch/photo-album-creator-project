import type {
  Album,
  AlbumSizePreset,
  ImageLayer,
  Layer,
  Page,
  PlaceholderLayer,
} from "@/types/album";

const uid = () => Math.random().toString(36).slice(2, 10);

export const ALBUM_TEMPLATE_VERSION = 1;

export interface AlbumTemplate {
  version: typeof ALBUM_TEMPLATE_VERSION;
  name: string;
  widthIn: number;
  heightIn: number;
  preset: AlbumSizePreset;
  dpi: number;
  pages: Omit<Page, "id">[];
}

export interface AlbumSlotStats {
  empty: number;
  filled: number;
  total: number;
}

export function countAlbumSlots(album: Album): AlbumSlotStats {
  let empty = 0;
  let filled = 0;
  for (const page of album.pages) {
    for (const layer of page.layers) {
      if (layer.type === "placeholder") empty++;
      else if (layer.type === "image") filled++;
    }
  }
  return { empty, filled, total: empty + filled };
}

export function collectPlaceholders(
  album: Album,
): { pageId: string; layer: PlaceholderLayer }[] {
  const result: { pageId: string; layer: PlaceholderLayer }[] = [];
  for (const page of album.pages) {
    for (const layer of page.layers) {
      if (layer.type === "placeholder") {
        result.push({ pageId: page.id, layer });
      }
    }
  }
  return result;
}

function imageToPlaceholder(img: ImageLayer): PlaceholderLayer {
  return {
    id: img.id,
    name: img.name.replace(/\.[^.]+$/, "") || "Photo",
    type: "placeholder",
    x: img.x,
    y: img.y,
    width: img.width,
    height: img.height,
    rotation: img.rotation,
    opacity: img.opacity,
    visible: img.visible,
    locked: img.locked,
    mask: img.mask,
    cornerRadius: img.cornerRadius,
    border: img.border,
  };
}

function layerToTemplateLayer(l: Layer): Layer {
  if (l.type === "image") return imageToPlaceholder(l);
  const { id: _id, ...rest } = l;
  return { ...rest, id: _id } as Layer;
}

function pageToTemplatePage(page: Page): Omit<Page, "id"> {
  const { id: _id, ...rest } = page;
  return {
    ...rest,
    layers: page.layers.map(layerToTemplateLayer),
  };
}

export function albumToTemplate(album: Album): AlbumTemplate {
  return {
    version: ALBUM_TEMPLATE_VERSION,
    name: album.name,
    widthIn: album.widthIn,
    heightIn: album.heightIn,
    preset: album.preset,
    dpi: album.dpi,
    pages: album.pages.map(pageToTemplatePage),
  };
}

function regenLayer(l: Layer): Layer {
  const next = { ...l, id: uid() };
  if (next.isTemplate) return next;
  return next;
}

export function templateToAlbum(template: AlbumTemplate): Album {
  const now = Date.now();
  return {
    id: uid(),
    name: template.name,
    widthIn: template.widthIn,
    heightIn: template.heightIn,
    preset: template.preset,
    dpi: template.dpi,
    pages: template.pages.map((p) => ({
      ...p,
      id: uid(),
      layers: p.layers.map(regenLayer),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function isAlbumTemplate(data: unknown): data is AlbumTemplate {
  if (!data || typeof data !== "object") return false;
  const t = data as AlbumTemplate;
  return (
    t.version === ALBUM_TEMPLATE_VERSION &&
    typeof t.name === "string" &&
    Array.isArray(t.pages) &&
    t.pages.length > 0
  );
}

export function downloadTemplateJson(template: AlbumTemplate) {
  const safeName = template.name.replace(/[^\w\s-]/g, "").trim() || "album-template";
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = `${safeName}.album-template.json`;
  a.click();
}

export function downloadAlbumTemplate(album: Album) {
  downloadTemplateJson(albumToTemplate(album));
}
