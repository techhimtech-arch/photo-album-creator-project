import type { ImageLayer, PhotoSlotLayer, PlaceholderLayer } from "@/types/album";
import type { LayoutSlot } from "@/lib/layouts";
import type { PhotoAsset } from "@/types/album";

const uid = () => Math.random().toString(36).slice(2, 10);

export function isPhotoSlot(l: { type: string }): l is PhotoSlotLayer {
  return l.type === "image" || l.type === "placeholder";
}

export function slotToPixels(
  slot: LayoutSlot,
  pageWpx: number,
  pageHpx: number,
  gap: number,
) {
  const sw = slot.w * pageWpx;
  const sh = slot.h * pageHpx;
  const sx = slot.x * pageWpx;
  const sy = slot.y * pageHpx;
  return {
    x: sx + gap / 2,
    y: sy + gap / 2,
    width: Math.max(10, sw - gap),
    height: Math.max(10, sh - gap),
  };
}

export function createPlaceholderLayer(
  slot: LayoutSlot,
  pageWpx: number,
  pageHpx: number,
  gap: number,
  index: number,
  existing?: PlaceholderLayer,
): PlaceholderLayer {
  const { x, y, width, height } = slotToPixels(slot, pageWpx, pageHpx, gap);
  return {
    id: existing?.id ?? uid(),
    name: existing?.name ?? `Photo ${index + 1}`,
    type: "placeholder",
    x,
    y,
    width,
    height,
    rotation: existing?.rotation ?? 0,
    opacity: existing?.opacity ?? 1,
    visible: existing?.visible ?? true,
    locked: existing?.locked ?? false,
    mask: existing?.mask ?? "none",
    cornerRadius: existing?.cornerRadius ?? 12,
    border: existing?.border ?? { width: 4, color: "#ffffff" },
  };
}

export function createImageLayerFromSlot(
  slot: LayoutSlot,
  pageWpx: number,
  pageHpx: number,
  gap: number,
  photo: PhotoAsset,
  existing?: ImageLayer,
): ImageLayer {
  const { x, y, width, height } = slotToPixels(slot, pageWpx, pageHpx, gap);
  return {
    id: existing?.id ?? uid(),
    name: photo.name,
    type: "image",
    src: photo.src,
    naturalWidth: photo.width,
    naturalHeight: photo.height,
    x,
    y,
    width,
    height,
    rotation: existing?.rotation ?? 0,
    opacity: existing?.opacity ?? 1,
    visible: existing?.visible ?? true,
    locked: existing?.locked ?? false,
    mask: existing?.mask ?? "none",
    cornerRadius: existing?.cornerRadius ?? 12,
    flipH: existing?.flipH ?? false,
    flipV: existing?.flipV ?? false,
    border: existing?.border ?? { width: 4, color: "#ffffff" },
    crop: existing?.crop,
    shadow: existing?.shadow,
    filters: existing?.filters,
  };
}

export function placeholderToImageLayer(
  placeholder: PlaceholderLayer,
  photo: PhotoAsset,
): ImageLayer {
  return {
    id: placeholder.id,
    name: photo.name,
    type: "image",
    src: photo.src,
    naturalWidth: photo.width,
    naturalHeight: photo.height,
    x: placeholder.x,
    y: placeholder.y,
    width: placeholder.width,
    height: placeholder.height,
    rotation: placeholder.rotation,
    opacity: placeholder.opacity,
    visible: placeholder.visible,
    locked: placeholder.locked,
    mask: placeholder.mask,
    cornerRadius: placeholder.cornerRadius,
    flipH: false,
    flipV: false,
    border: placeholder.border,
  };
}
