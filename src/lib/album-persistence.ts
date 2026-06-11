import { get, set, del } from "idb-keyval";
import type { Album, PhotoAsset, DecorationAsset } from "@/types/album";
import type { AlbumLayout } from "@/lib/layouts";
import type { AlbumTemplate } from "@/lib/album-template";

const ALBUM_KEY = "wedding-album-designer:album:v1";
const PHOTOS_KEY = "wedding-album-designer:photos:v1";
const DECOR_KEY = "wedding-album-designer:decorations:v1";
const LAYOUTS_KEY = "wedding-album-designer:layouts:v1";
const TEMPLATE_LIB_KEY = "wedding-album-designer:template-library:v1";
const WORKFLOW_KEY = "wedding-album-designer:workflow:v1";

export type WorkflowMode = "converter" | "designer" | "producer";

export async function loadAlbum(): Promise<Album | null> {
  try {
    return (await get<Album>(ALBUM_KEY)) ?? null;
  } catch {
    return null;
  }
}
export async function saveAlbum(album: Album): Promise<void> {
  await set(ALBUM_KEY, album);
}
export async function clearAlbum(): Promise<void> {
  await del(ALBUM_KEY);
}

export async function loadPhotos(): Promise<PhotoAsset[]> {
  try {
    return (await get<PhotoAsset[]>(PHOTOS_KEY)) ?? [];
  } catch {
    return [];
  }
}
export async function savePhotos(photos: PhotoAsset[]): Promise<void> {
  await set(PHOTOS_KEY, photos);
}

export async function loadDecorations(): Promise<DecorationAsset[]> {
  try {
    return (await get<DecorationAsset[]>(DECOR_KEY)) ?? [];
  } catch {
    return [];
  }
}
export async function saveDecorations(d: DecorationAsset[]): Promise<void> {
  await set(DECOR_KEY, d);
}

export async function loadCustomLayouts(): Promise<AlbumLayout[]> {
  try {
    return (await get<AlbumLayout[]>(LAYOUTS_KEY)) ?? [];
  } catch {
    return [];
  }
}
export async function saveCustomLayouts(layouts: AlbumLayout[]): Promise<void> {
  await set(LAYOUTS_KEY, layouts);
}

export async function loadTemplateLibrary(): Promise<AlbumTemplate[]> {
  try {
    return (await get<AlbumTemplate[]>(TEMPLATE_LIB_KEY)) ?? [];
  } catch {
    return [];
  }
}
export async function saveTemplateLibrary(templates: AlbumTemplate[]): Promise<void> {
  await set(TEMPLATE_LIB_KEY, templates);
}

export async function loadWorkflowMode(): Promise<WorkflowMode> {
  try {
    return (await get<WorkflowMode>(WORKFLOW_KEY)) ?? "producer";
  } catch {
    return "producer";
  }
}
export async function saveWorkflowMode(mode: WorkflowMode): Promise<void> {
  await set(WORKFLOW_KEY, mode);
}

export async function getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return {
    usageMB: Math.round(((e.usage ?? 0) / 1024 / 1024) * 10) / 10,
    quotaMB: Math.round((e.quota ?? 0) / 1024 / 1024),
  };
}
