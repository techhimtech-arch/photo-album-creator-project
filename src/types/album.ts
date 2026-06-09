export type AlbumSizePreset = "12x36" | "12x24" | "12x30" | "custom";

export interface AlbumSize {
  widthIn: number;
  heightIn: number;
  preset: AlbumSizePreset;
}

export type MaskKind = "none" | "rounded" | "circle" | "heart" | "star" | "hexagon" | "triangle";

export interface ImageCrop {
  x: number; // 0-1
  y: number;
  w: number;
  h: number;
}

export interface Border {
  width: number;
  color: string;
}

export interface Shadow {
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
}

export interface LayerBase {
  id: string;
  name: string;
  x: number; // px (at album internal pixel coords)
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0-1
  visible: boolean;
  locked: boolean;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  src: string; // data URL / object URL
  naturalWidth: number;
  naturalHeight: number;
  crop?: ImageCrop;
  mask: MaskKind;
  cornerRadius: number; // for rounded mask
  flipH: boolean;
  flipV: boolean;
  border?: Border;
  shadow?: Shadow;
  filters?: {
    brightness?: number; // -1 to 1
    contrast?: number; // -100 to 100
    blur?: number; // 0 to 40
    grayscale?: boolean;
    sepia?: boolean;
  };
}

export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  fill: string;
  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  stroke?: { color: string; width: number };
  shadow?: Shadow;
  curve: number; // -100..100, 0 = straight
}

export interface DecorationLayer extends LayerBase {
  type: "decoration";
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  blendMode:
    | "source-over"
    | "multiply"
    | "screen"
    | "overlay"
    | "soft-light"
    | "hard-light"
    | "darken"
    | "lighten";
}

export type Layer = ImageLayer | TextLayer | DecorationLayer;

export type PageBackground =
  | { kind: "color"; color: string }
  | {
      kind: "gradient";
      gradient: "linear" | "radial";
      from: string;
      to: string;
      angle: number; // for linear, degrees
    }
  | {
      kind: "image";
      src: string;
      fit: "cover" | "contain" | "tile";
      opacity: number;
    };

export interface Page {
  id: string;
  background: PageBackground;
  layers: Layer[];
}

export interface Album {
  id: string;
  name: string;
  widthIn: number;
  heightIn: number;
  preset: AlbumSizePreset;
  dpi: number;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

export interface PhotoAsset {
  id: string;
  name: string;
  src: string; // data URL
  width: number;
  height: number;
  addedAt: number;
}

export interface DecorationAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  addedAt: number;
}

export const ALBUM_PRESETS: Record<Exclude<AlbumSizePreset, "custom">, { widthIn: number; heightIn: number; label: string }> = {
  "12x36": { widthIn: 36, heightIn: 12, label: "12 × 36 in (spread)" },
  "12x24": { widthIn: 24, heightIn: 12, label: "12 × 24 in (spread)" },
  "12x30": { widthIn: 30, heightIn: 12, label: "12 × 30 in (spread)" },
};
