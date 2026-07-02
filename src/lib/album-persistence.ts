import { get, set, del } from "idb-keyval";
import type { Album, PhotoAsset, DecorationAsset, ProjectMetadata } from "@/types/album";
import type { AlbumLayout } from "@/lib/layouts";
import type { AlbumTemplate } from "@/lib/album-template";

const LEGACY_ALBUM_KEY = "wedding-album-designer:album:v1";
const LEGACY_PHOTOS_KEY = "wedding-album-designer:photos:v1";

const PROJECTS_LIST_KEY = "wedding-album-designer:projects-list:v2";
const DECOR_KEY = "wedding-album-designer:decorations:v1";
const LAYOUTS_KEY = "wedding-album-designer:layouts:v1";
const TEMPLATE_LIB_KEY = "wedding-album-designer:template-library:v1";
const WORKFLOW_KEY = "wedding-album-designer:workflow:v1";
const LAST_PROJECT_ID_KEY = "wedding-album-designer:last-project-id:v1";

export type WorkflowMode = "converter" | "designer" | "producer";

// Helper keys for per-project storage
function getProjectAlbumKey(id: string) {
  return `wedding-album-designer:project:${id}:album:v1`;
}
function getProjectPhotosKey(id: string) {
  return `wedding-album-designer:project:${id}:photos:v1`;
}

// Last active project tracking
export async function loadLastProjectId(): Promise<string | null> {
  try {
    return (await get<string>(LAST_PROJECT_ID_KEY)) ?? null;
  } catch {
    return null;
  }
}
export async function saveLastProjectId(id: string): Promise<void> {
  await set(LAST_PROJECT_ID_KEY, id);
}

// Projects List Management
export async function loadProjectsList(): Promise<ProjectMetadata[]> {
  try {
    const list = await get<ProjectMetadata[]>(PROJECTS_LIST_KEY);
    if (list) return list;

    // Check for migration from legacy single project
    const legacyAlbum = await get<Album>(LEGACY_ALBUM_KEY);
    if (legacyAlbum) {
      const legacyPhotos = (await get<PhotoAsset[]>(LEGACY_PHOTOS_KEY)) ?? [];
      const newId = legacyAlbum.id || "legacy-project";
      
      const newProjectMeta: ProjectMetadata = {
        id: newId,
        name: legacyAlbum.name || "My Migrated Album",
        preset: legacyAlbum.preset,
        createdAt: legacyAlbum.createdAt || Date.now(),
        updatedAt: legacyAlbum.updatedAt || Date.now(),
      };

      // Save into project-specific stores
      await set(getProjectAlbumKey(newId), { ...legacyAlbum, id: newId });
      await set(getProjectPhotosKey(newId), legacyPhotos);
      
      // Save projects list with this entry
      const newList = [newProjectMeta];
      await set(PROJECTS_LIST_KEY, newList);

      // Clean up legacy keys
      await del(LEGACY_ALBUM_KEY);
      await del(LEGACY_PHOTOS_KEY);

      return newList;
    }

    return [];
  } catch (e) {
    console.error("Failed to load projects list", e);
    return [];
  }
}

export async function saveProjectsList(list: ProjectMetadata[]): Promise<void> {
  await set(PROJECTS_LIST_KEY, list);
}

// Project Album loading / saving
export async function loadAlbum(projectId: string): Promise<Album | null> {
  try {
    return (await get<Album>(getProjectAlbumKey(projectId))) ?? null;
  } catch {
    return null;
  }
}

export async function saveAlbum(projectId: string, album: Album): Promise<void> {
  await set(getProjectAlbumKey(projectId), album);
}

export async function clearAlbum(projectId: string): Promise<void> {
  await del(getProjectAlbumKey(projectId));
}

// Project Photos loading / saving
export async function loadPhotos(projectId: string): Promise<PhotoAsset[]> {
  try {
    const photos = (await get<PhotoAsset[]>(getProjectPhotosKey(projectId))) ?? [];
    // Regenerate Object URLs for files
    for (const p of photos) {
      if (p.file) {
        try {
          p.src = URL.createObjectURL(p.file);
        } catch (e) {
          console.error("Failed to create Object URL for photo file", e);
        }
      }
    }
    return photos;
  } catch {
    return [];
  }
}

export async function savePhotos(projectId: string, photos: PhotoAsset[]): Promise<void> {
  // Do not serialize active object URLs - strip or ignore, we only serialize metadata + raw files
  const cleanPhotos = photos.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src, ...rest } = p;
    return {
      ...rest,
      // If we don't have a file but have a base64 string in src, keep src. Otherwise set placeholder.
      src: p.file ? "" : p.src,
    } as PhotoAsset;
  });
  await set(getProjectPhotosKey(projectId), cleanPhotos);
}

export async function deleteProject(projectId: string): Promise<void> {
  await del(getProjectAlbumKey(projectId));
  await del(getProjectPhotosKey(projectId));
  const list = await loadProjectsList();
  await saveProjectsList(list.filter(p => p.id !== projectId));
}

// Shared settings (Decorations, Custom layouts, Template library)
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
