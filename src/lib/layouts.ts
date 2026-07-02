// Layout slots are normalized 0..1 within page bounds.
export interface LayoutSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

import type { TextLayer, DecorationLayer, PageBackground, PhotoAsset } from "@/types/album";

export type TemplateElement = (
  | Omit<TextLayer, "id" | "x" | "y" | "width" | "height">
  | Omit<DecorationLayer, "id" | "x" | "y" | "width" | "height">
) & {
  rx: number; // relative x (0-1)
  ry: number; // relative y (0-1)
  rw: number; // relative width (0-1)
  rh: number; // relative height (0-1)
};

export interface AlbumLayout {
  id: string;
  name: string;
  category: "1" | "2" | "3" | "4" | "5" | "6" | "collage";
  slots: LayoutSlot[];
  elements?: TemplateElement[];
  background?: PageBackground;
  aspectHint?: "landscape" | "portrait" | "any";
}

const M = 0.04; // margin
const G = 0.015; // gap

export const LAYOUTS: AlbumLayout[] = [
  // 1 photo
  { id: "1-full", name: "Full bleed spread", category: "1", slots: [{ x: 0, y: 0, w: 1, h: 1 }], aspectHint: "landscape" },
  {
    id: "1-center",
    name: "Centered Portrait / Landscape",
    category: "1",
    slots: [{ x: M * 2, y: M * 2, w: 1 - M * 4, h: 1 - M * 4 }],
  },
  {
    id: "1-panorama",
    name: "Panorama spread",
    category: "1",
    slots: [{ x: M, y: 0.1, w: 1 - M * 2, h: 0.8 }],
    aspectHint: "landscape"
  },
  
  // 2 photos
  {
    id: "2-split-h",
    name: "Side by side Splits",
    category: "2",
    slots: [
      { x: M, y: M, w: 0.5 - M - G / 2, h: 1 - M * 2 },
      { x: 0.5 + G / 2, y: M, w: 0.5 - M - G / 2, h: 1 - M * 2 },
    ],
  },
  {
    id: "2-split-v",
    name: "Stacked Splits",
    category: "2",
    slots: [
      { x: M, y: M, w: 1 - M * 2, h: 0.5 - M - G / 2 },
      { x: M, y: 0.5 + G / 2, w: 1 - M * 2, h: 0.5 - M - G / 2 },
    ],
  },
  {
    id: "2-split-magazine",
    name: "Modern Magazine Split",
    category: "2",
    slots: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.76 },
      { x: 0.53, y: 0.05, w: 0.42, h: 0.76 },
    ],
    elements: [
      {
        type: "text",
        name: "Magazine Caption",
        text: "MOMENTS TO CHERISH FOREVER",
        fontFamily: "Lora",
        fontSize: 16,
        fontWeight: 400,
        fontStyle: "normal",
        fill: "#475569",
        align: "center",
        letterSpacing: 2,
        lineHeight: 1.2,
        curve: 0,
        opacity: 1,
        visible: true,
        locked: false,
        rx: 0.05,
        ry: 0.86,
        rw: 0.9,
        rh: 0.08,
      }
    ]
  },

  // 3 photos
  {
    id: "3-feature-left",
    name: "Feature Left + 2 Right",
    category: "3",
    slots: [
      { x: M, y: M, w: 0.6 - M - G / 2, h: 1 - M * 2 },
      { x: 0.6 + G / 2, y: M, w: 0.4 - M - G / 2, h: 0.5 - M - G / 2 },
      { x: 0.6 + G / 2, y: 0.5 + G / 2, w: 0.4 - M - G / 2, h: 0.5 - M - G / 2 },
    ],
  },
  {
    id: "3-row",
    name: "Three across rows",
    category: "3",
    slots: [
      { x: M, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
      { x: M + (1 - M * 2 - G * 2) / 3 + G, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
      { x: M + ((1 - M * 2 - G * 2) / 3 + G) * 2, y: M, w: (1 - M * 2 - G * 2) / 3, h: 1 - M * 2 },
    ],
  },
  {
    id: "3-hero-magazine",
    name: "Hero Magazine Spreads",
    category: "3",
    slots: [
      { x: 0.05, y: 0.16, w: 0.48, h: 0.74 },
      { x: 0.58, y: 0.16, w: 0.37, h: 0.34 },
      { x: 0.58, y: 0.56, w: 0.37, h: 0.34 },
    ],
    elements: [
      {
        type: "text",
        name: "Magazine Title",
        text: "OUR BEAUTIFUL STORY",
        fontFamily: "Playfair Display",
        fontSize: 24,
        fontWeight: 600,
        fontStyle: "normal",
        fill: "#1e293b",
        align: "center",
        letterSpacing: 4,
        lineHeight: 1.2,
        curve: 0,
        opacity: 1,
        visible: true,
        locked: false,
        rx: 0.05,
        ry: 0.04,
        rw: 0.9,
        rh: 0.08,
      }
    ]
  },

  // 4 photos
  {
    id: "4-grid",
    name: "Balanced 2 × 2 grid",
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
    name: "Four across column grid",
    category: "4",
    slots: Array.from({ length: 4 }, (_, i) => ({
      x: M + i * ((1 - M * 2 - G * 3) / 4 + G),
      y: M,
      w: (1 - M * 2 - G * 3) / 4,
      h: 1 - M * 2,
    })),
  },
  {
    id: "4-grid-masonry",
    name: "Asymmetric Masonry Grid",
    category: "4",
    slots: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.54 },
      { x: 0.53, y: 0.05, w: 0.42, h: 0.34 },
      { x: 0.05, y: 0.65, w: 0.42, h: 0.3 },
      { x: 0.53, y: 0.45, w: 0.42, h: 0.5 },
    ],
  },

  // 5 photos
  {
    id: "5-feature-top",
    name: "Feature Top + 4 Bottom",
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
  {
    id: "5-grid-modern",
    name: "Asymmetric Grid 5 Slots",
    category: "5",
    slots: [
      { x: 0.05, y: 0.05, w: 0.3, h: 0.42 },
      { x: 0.38, y: 0.05, w: 0.57, h: 0.42 },
      { x: 0.05, y: 0.53, w: 0.28, h: 0.42 },
      { x: 0.36, y: 0.53, w: 0.28, h: 0.42 },
      { x: 0.67, y: 0.53, w: 0.28, h: 0.42 },
    ],
  },

  // 6 photos
  {
    id: "6-grid",
    name: "Standard 3 × 2 grid",
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
    name: "Balanced Mosaic Collage",
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

/**
 * aspect-ratio layout matcher
 * Standardizes layout slot orientations and matches photos to candidate slots.
 * Computes a mismatch score based on orientation and aspect ratio differences.
 */
export function findBestLayoutForPhotos(
  photos: PhotoAsset[],
  layouts: AlbumLayout[],
  pageAspect: number
): AlbumLayout | null {
  const n = photos.length;
  if (n === 0) return null;
  
  const category = n > 6 ? "collage" : n.toString() as AlbumLayout["category"];
  const candidates = layouts.filter((l) => l.category === category);
  if (candidates.length === 0) return null;

  let bestLayout: AlbumLayout | null = null;
  let bestScore = Infinity;

  // 1. Sort incoming photo aspects ascending
  const photoAspects = photos.map((p) => p.width / p.height).sort((a, b) => a - b);

  for (const layout of candidates) {
    // 2. Compute slot aspects in canvas coordinate systems
    const slotAspects = layout.slots
      .map((s) => (s.w * pageAspect) / s.h)
      .sort((a, b) => a - b);

    let score = 0;
    const itemsCount = Math.min(n, slotAspects.length);

    for (let i = 0; i < itemsCount; i++) {
      const pAspect = photoAspects[i];
      const sAspect = slotAspects[i];

      // Standardize to log difference of ratio
      score += Math.abs(Math.log(pAspect / sAspect));

      // Standardize orientation tags
      const pOrient = pAspect < 0.85 ? "portrait" : pAspect > 1.15 ? "landscape" : "square";
      const sOrient = sAspect < 0.85 ? "portrait" : sAspect > 1.15 ? "landscape" : "square";

      if (pOrient !== sOrient) {
        if (
          (pOrient === "portrait" && sOrient === "landscape") ||
          (pOrient === "landscape" && sOrient === "portrait")
        ) {
          score += 15.0; // severe mismatch penalty
        } else {
          score += 4.0; // mild mismatch penalty involving square
        }
      }
    }

    if (score < bestScore) {
      bestScore = score;
      bestLayout = layout;
    }
  }

  return bestLayout;
}
