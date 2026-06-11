import "ag-psd/initialize-canvas";
import { readPsd, type Layer as PsdLayer } from "ag-psd";
import type { AlbumSizePreset, Layer, Page, PageBackground, PlaceholderLayer, TextLayer } from "@/types/album";
import type { AlbumTemplate } from "@/lib/album-template";
import { ALBUM_TEMPLATE_VERSION } from "@/lib/album-template";
import { EDITOR_DPI } from "@/lib/units";
import { ALBUM_PRESETS } from "@/types/album";

const uid = () => Math.random().toString(36).slice(2, 10);

export interface PsdLayerInfo {
  id: string;
  name: string;
  kind: "photo-slot" | "text" | "group" | "other";
  x: number;
  y: number;
  width: number;
  height: number;
  included: boolean;
}

export interface PsdParseResult {
  fileName: string;
  psdWidth: number;
  psdHeight: number;
  dpi: number;
  widthIn: number;
  heightIn: number;
  preset: AlbumSizePreset;
  layers: PsdLayerInfo[];
  page: Omit<Page, "id">;
}

function flattenLayers(layers: PsdLayer[] | undefined, out: PsdLayer[] = []): PsdLayer[] {
  if (!layers) return out;
  for (const l of layers) {
    if (l.children?.length) {
      flattenLayers(l.children, out);
    } else if (!l.sectionDivider) {
      out.push(l);
    }
  }
  return out;
}

function layerBounds(layer: PsdLayer) {
  const left = layer.left ?? 0;
  const top = layer.top ?? 0;
  const right = layer.right ?? left;
  const bottom = layer.bottom ?? top;
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function psdPxToEditorPx(px: number, dpi: number) {
  return (px / dpi) * EDITOR_DPI;
}

function inferSize(widthPx: number, heightPx: number, dpi: number) {
  const widthIn = Math.round((widthPx / dpi) * 10) / 10;
  const heightIn = Math.round((heightPx / dpi) * 10) / 10;

  for (const [key, val] of Object.entries(ALBUM_PRESETS)) {
    if (Math.abs(val.widthIn - widthIn) < 0.6 && Math.abs(val.heightIn - heightIn) < 0.6) {
      return { widthIn: val.widthIn, heightIn: val.heightIn, preset: key as AlbumSizePreset };
    }
  }
  return { widthIn, heightIn, preset: "custom" as AlbumSizePreset };
}

function colorToHex(color: { r?: number; g?: number; b?: number } | undefined): string {
  if (!color) return "#000000";
  const r = Math.round((color.r ?? 0) * (color.r <= 1 ? 255 : 1));
  const g = Math.round((color.g ?? 0) * (color.g <= 1 ? 255 : 1));
  const b = Math.round((color.b ?? 0) * (color.b <= 1 ? 255 : 1));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function classifyLayer(layer: PsdLayer, docW: number, docH: number): PsdLayerInfo["kind"] {
  if (layer.hidden) return "other";
  if (layer.text) return "text";
  if (layer.placedLayer) return "photo-slot";
  
  const { width, height } = layerBounds(layer);
  const area = width * height;
  const docArea = docW * docH;

  // Skip layers that are almost the whole page (likely backgrounds)
  if (area > docArea * 0.95) return "other";
  // Skip tiny layers
  if (width < 30 || height < 30) return "other";

  const name = (layer.name || "").toLowerCase();
  
  // If it's explicitly named background, skip it
  if (/bg|background/i.test(name)) return "other";

  // More permissive matching: include shapes, rectangles, ellipses, and generic layers
  if (/photo|img|image|pic|slot|picture|frame|smart|shape|rectangle|ellipse|polygon|layer/i.test(name)) return "photo-slot";

  return "photo-slot"; // Default to treating other unknown layers as slots too if they passed size checks
}

function isSlotKind(kind: PsdLayerInfo["kind"]) {
  return kind === "photo-slot";
}

function psdTextToLayer(layer: PsdLayer, dpi: number, index: number): TextLayer {
  const b = layerBounds(layer);
  const t = layer.text!;
  const style = t.styleRuns?.[0]?.style ?? t.style;
  const fontSize = style?.fontSize ?? 24;
  return {
    id: uid(),
    name: layer.name || `Text ${index + 1}`,
    type: "text",
    text: t.text || "",
    fontFamily: style?.font?.name || "Georgia",
    fontSize: Math.max(8, psdPxToEditorPx(fontSize, dpi)),
    fontWeight: style?.fauxBold ? 700 : 400,
    fontStyle: style?.fauxItalic ? "italic" : "normal",
    fill: colorToHex(style?.fillColor as { r?: number; g?: number; b?: number }),
    align: t.paragraphStyle?.justification?.includes("center")
      ? "center"
      : t.paragraphStyle?.justification?.includes("right")
        ? "right"
        : "left",
    letterSpacing: 0,
    lineHeight: 1.2,
    curve: 0,
    x: psdPxToEditorPx(b.x, dpi),
    y: psdPxToEditorPx(b.y, dpi),
    width: psdPxToEditorPx(b.width, dpi),
    height: psdPxToEditorPx(b.height, dpi),
    rotation: 0,
    opacity: (layer.opacity ?? 255) / 255,
    visible: !layer.hidden,
    locked: false,
  };
}

function psdSlotToPlaceholder(layer: PsdLayer, dpi: number, index: number): PlaceholderLayer {
  const b = layerBounds(layer);
  return {
    id: uid(),
    name: layer.name || `Photo ${index + 1}`,
    type: "placeholder",
    x: psdPxToEditorPx(b.x, dpi),
    y: psdPxToEditorPx(b.y, dpi),
    width: psdPxToEditorPx(b.width, dpi),
    height: psdPxToEditorPx(b.height, dpi),
    rotation: 0,
    opacity: (layer.opacity ?? 255) / 255,
    visible: !layer.hidden,
    locked: false,
    mask: "none",
    cornerRadius: 12,
    border: { width: 4, color: "#ffffff" },
  };
}

function defaultBackground(psd: { canvas?: HTMLCanvasElement }): PageBackground {
  if (psd.canvas) {
    try {
      const src = psd.canvas.toDataURL("image/jpeg", 0.85);
      return { kind: "image", src, fit: "cover", opacity: 1 };
    } catch {
      /* canvas too large */
    }
  }
  return { kind: "color", color: "#ffffff" };
}

export async function parsePsdFile(file: File, dpi = 300): Promise<PsdParseResult> {
  const buffer = await file.arrayBuffer();
  const psd = readPsd(buffer, {
    skipLayerImageData: true,
    skipCompositeImageData: true,
    skipThumbnail: true,
    skipLinkedFilesData: true,
  });

  const flat = flattenLayers(psd.children);
  const { widthIn, heightIn, preset } = inferSize(psd.width, psd.height, dpi);

  const layerInfos: PsdLayerInfo[] = flat.map((layer) => {
    const b = layerBounds(layer);
    const kind = classifyLayer(layer, psd.width, psd.height);
    return {
      id: uid(),
      name: layer.name || "Layer",
      kind,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      included: kind === "photo-slot" || kind === "text",
    };
  });

  // Store the raw ag-psd layers temporarily to build the page later
  // We can't put raw psd layers into state easily, so we build all editor layers up front
  let slotIndex = 0;
  const editorLayers: Layer[] = [];
  flat.forEach((layer, i) => {
    const info = layerInfos[i];
    if (info.kind === "text" && layer.text) {
      editorLayers.push(psdTextToLayer(layer, dpi, editorLayers.length));
    } else {
      editorLayers.push(psdSlotToPlaceholder(layer, dpi, slotIndex++));
    }
  });

  const page: Omit<Page, "id"> = {
    background: defaultBackground(psd),
    layers: editorLayers, // ConverterView will filter this using layerInfos.included
    status: "draft",
  };

  return {
    fileName: file.name,
    psdWidth: psd.width,
    psdHeight: psd.height,
    dpi,
    widthIn,
    heightIn,
    preset,
    layers: layerInfos,
    page,
  };
}

export function buildTemplateFromPsdPages(
  name: string,
  pages: Omit<Page, "id">[],
  widthIn: number,
  heightIn: number,
  preset: AlbumSizePreset,
  dpi = 300,
): AlbumTemplate {
  return {
    version: ALBUM_TEMPLATE_VERSION,
    name,
    widthIn,
    heightIn,
    preset,
    dpi,
    pages,
  };
}

