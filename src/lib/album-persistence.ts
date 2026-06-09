import { get, set, del } from "idb-keyval";
import type { Album, PhotoAsset, DecorationAsset } from "@/types/album";

const ALBUM_KEY = "wedding-album-designer:album:v1";
const PHOTOS_KEY = "wedding-album-designer:photos:v1";
const DECOR_KEY = "wedding-album-designer:decorations:v1";

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

export async function getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return {
    usageMB: Math.round(((e.usage ?? 0) / 1024 / 1024) * 10) / 10,
    quotaMB: Math.round((e.quota ?? 0) / 1024 / 1024),
  };
}
