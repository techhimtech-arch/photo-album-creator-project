// Layout slots are normalized 0..1 within page bounds.
export interface LayoutSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface AlbumLayout {
  id: string;
  name: string;
  category: "1" | "2" | "3" | "4" | "5" | "6" | "collage";
  slots: LayoutSlot[];
  aspectHint?: "landscape" | "portrait" | "any";
}

const M = 0.04; // margin
const G = 0.015; // gap

export const LAYOUTS: AlbumLayout[] = [
  // 1 photo
  { id: "1-full", name: "Full bleed", category: "1", slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  {
    id: "1-center",
    name: "Centered",
    category: "1",
    slots: [{ x: M * 2, y: M * 2, w: 1 - M * 4, h: 1 - M * 4 }],
  },
  // 2 photos
  {
    id: "2-split-h",
    name: "Side by side",
    category: "2",
    slots: [
      { x: M, y: M, w: 0.5 - M - G / 2, h: 1 - M * 2 },
      { x: 0.5 + G / 2, y: M, w: 0.5 - M - G / 2, h: 1 - M * 2 },
    ],
  },
  {
    id: "2-split-v",
    name: "Stacked",
    category: "2",
    slots: [
      { x: M, y: M, w: 1 - M * 2, h: 0.5 - M - G / 2 },
      { x: M, y: 0.5 + G / 2, w: 1 - M * 2, h: 0.5 - M - G / 2 },
    ],
  },
  // 3 photos
  {
    id: "3-feature-left",
    name: "Feature + 2",
    category: "3",
    slots: [
      { x: M, y: M, w: 0.6 - M - G / 2, h: 1 - M * 2 },
      { x: 0.6 + G / 2, y: M, w: 0.4 - M - G / 2, h: 0.5 - M - G / 2 },
      { x: 0.6 + G / 2, y: 0.5 + G / 2, w: 0.4 - M - G / 2, h: 0.5 - M - G / 2 },
    ],
  },
  {
    id: "3-row",
    name: "Three across",
    category: "3",
    slots: [
      { x: M, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
      { x: M + (1 - M * 2 - G * 2) / 3 + G, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
      { x: M + ((1 - M * 2 - G * 2) / 3 + G) * 2, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
    ],
  },
  // 4 photos
  {
    id: "4-grid",
    name: "2 × 2 grid",
    category: "4",
    slots: [
      { x: M, y: M, w: 0.5 - M - G / 2, h: 0.5 - M - G / 2 },
      { x: 0.5 + G / 2, y: M, w: 0.5 - M - G / 2, h: 0.5 - M - G / 2 },
      { x: M, y: 0.5 + G / 2, w: 0.5 - M - G / 2, h: 0.5 - M - G / 2 },
      { x: 0.5 + G / 2, y: 0.5 + G / 2, w: 0.5 - M - G / 2, h: 0.5 - M - G / 2 },
    ],
  },
  {
    id: "4-row",
    name: "Four across",
    category: "4",
    slots: Array.from({ length: 4 }, (_, i) => ({
      x: M + i * ((1 - M * 2 - G * 3) / 4 + G),
      y: M,
      w: (1 - M * 2 - G * 3) / 4,
      h: 1 - M * 2,
    })),
  },
  // 5 photos
  {
    id: "5-feature-top",
    name: "Feature + 4",
    category: "5",
    slots: [
      { x: M, y: M, w: 1 - M * 2, h: 0.55 - M - G / 2 },
      ...Array.from({ length: 4 }, (_, i) => ({
        x: M + i * ((1 - M * 2 - G * 3) / 4 + G),
        y: 0.55 + G / 2,
        w: (1 - M * 2 - G * 3) / 4,
        h: 0.45 - M - G / 2,
      })),
    ],
  },
  // 6 photos
  {
    id: "6-grid",
    name: "3 × 2 grid",
    category: "6",
    slots: Array.from({ length: 6 }, (_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        x: M + col * ((1 - M * 2 - G * 2) / 3 + G),
        y: M + row * ((1 - M * 2 - G) / 2 + G),
        w: (1 - M * 2 - G * 2) / 3,
        h: (1 - M * 2 - G) / 2,
      };
    }),
  },
  // Collage
  {
    id: "collage-mosaic",
    name: "Mosaic",
    category: "collage",
    slots: [
      { x: M, y: M, w: 0.5 - M - G / 2, h: 0.66 - M - G / 2 },
      { x: 0.5 + G / 2, y: M, w: 0.25 - G, h: 0.33 - M - G / 2 },
      { x: 0.75 + G / 2, y: M, w: 0.25 - M - G / 2, h: 0.33 - M - G / 2 },
      { x: 0.5 + G / 2, y: 0.33 + G / 2, w: 0.5 - M - G / 2, h: 0.33 - G },
      { x: M, y: 0.66 + G / 2, w: 0.33 - G, h: 0.34 - M - G / 2 },
      { x: 0.33 + G / 2, y: 0.66 + G / 2, w: 0.33 - G, h: 0.34 - M - G / 2 },
      { x: 0.66 + G / 2, y: 0.66 + G / 2, w: 0.34 - M - G / 2, h: 0.34 - M - G / 2 },
    ],
  },
];

export function getLayoutById(id: string) {
  return LAYOUTS.find((l) => l.id === id);
}
