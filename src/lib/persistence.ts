import { get, set, del } from "idb-keyval";
import type { CardDesign, ColumnMapping, PhotoFile, Student } from "@/types/idcard";

const KEY = "idcard-studio:state:v1";

export interface PersistedState {
  step: number;
  headers: string[];
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  photos: PhotoFile[];
  students: Student[];
  design: CardDesign;
  savedAt: number;
}

export async function saveState(state: Omit<PersistedState, "savedAt">): Promise<void> {
  await set(KEY, { ...state, savedAt: Date.now() });
}

export async function loadState(): Promise<PersistedState | null> {
  try {
    const v = await get<PersistedState>(KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function clearState(): Promise<void> {
  await del(KEY);
}

export function exportProject(state: Omit<PersistedState, "savedAt">) {
  const blob = new Blob([JSON.stringify({ ...state, savedAt: Date.now(), version: 1 }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `id-card-project-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProject(file: File): Promise<PersistedState> {
  const text = await file.text();
  const parsed = JSON.parse(text) as PersistedState;
  if (!parsed || !Array.isArray(parsed.rows) || !parsed.design) {
    throw new Error("Invalid project file");
  }
  return parsed;
}

export async function getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return {
    usageMB: Math.round(((e.usage ?? 0) / 1024 / 1024) * 10) / 10,
    quotaMB: Math.round(((e.quota ?? 0) / 1024 / 1024)),
  };
}
