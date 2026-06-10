// Off-screen high-res export. Re-renders each page into a fresh Konva stage at the target DPI.
import Konva from "konva";
import jsPDF from "jspdf";
import { useAlbumStore } from "@/lib/album-store";
import type { Album, Page, Layer } from "@/types/album";

interface ExportOptions {
  format: "pdf" | "png" | "jpg";
  scope: "all" | "current";
  dpi: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

async function renderPageToCanvas(
  album: Album,
  page: Page,
  dpi: number,
): Promise<HTMLCanvasElement> {
  const widthPx = Math.round(album.widthIn * dpi);
  const heightPx = Math.round(album.heightIn * dpi);

  // Editor coordinates are at 72 DPI; scale up to export DPI.
  const scale = dpi / 72;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-99999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const stage = new Konva.Stage({
    container,
    width: widthPx,
    height: heightPx,
  });
  const klayer = new Konva.Layer();
  stage.add(klayer);

  // Group with scale so we reuse our editor coordinate system
  const root = new Konva.Group({ scaleX: scale, scaleY: scale });
  klayer.add(root);

  // Background
  const bg = page.background;
  if (bg.kind === "color") {
    root.add(new Konva.Rect({ x: 0, y: 0, width: widthPx / scale, height: heightPx / scale, fill: bg.color }));
  } else if (bg.kind === "gradient") {
    const w = widthPx / scale, h = heightPx / scale;
    if (bg.gradient === "linear") {
      const rad = (bg.angle * Math.PI) / 180;
      root.add(new Konva.Rect({
        x: 0, y: 0, width: w, height: h,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: Math.cos(rad) * w, y: Math.sin(rad) * h },
        fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
      }));
    } else {
      root.add(new Konva.Rect({
        x: 0, y: 0, width: w, height: h,
        fillRadialGradientStartPoint: { x: w / 2, y: h / 2 },
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: { x: w / 2, y: h / 2 },
        fillRadialGradientEndRadius: Math.max(w, h) / 1.5,
        fillRadialGradientColorStops: [0, bg.from, 1, bg.to],
      }));
    }
  } else if (bg.kind === "image" && bg.src) {
    try {
      const img = await loadImg(bg.src);
      const w = widthPx / scale, h = heightPx / scale;
      let dx = 0, dy = 0, dw = w, dh = h;
      if (bg.fit === "cover") {
        const s = Math.max(w / img.width, h / img.height);
        dw = img.width * s; dh = img.height * s;
        dx = (w - dw) / 2; dy = (h - dh) / 2;
      } else if (bg.fit === "contain") {
        const s = Math.min(w / img.width, h / img.height);
        dw = img.width * s; dh = img.height * s;
        dx = (w - dw) / 2; dy = (h - dh) / 2;
      }
      root.add(new Konva.Image({ image: img, x: dx, y: dy, width: dw, height: dh, opacity: bg.opacity }));
    } catch { /* ignore */ }
  }

  // Layers in order
  for (const l of page.layers) {
    if (!l.visible) continue;
    await addLayerToRoot(root, l);
  }

  klayer.draw();
  const canvas = stage.toCanvas({ pixelRatio: 1 });

  stage.destroy();
  document.body.removeChild(container);
  return canvas;
}

async function addLayerToRoot(root: Konva.Group, l: Layer) {
  if (l.type === "image") {
    try {
      const img = await loadImg(l.src);
      const group = new Konva.Group({
        x: l.x, y: l.y, width: l.width, height: l.height,
        rotation: l.rotation, opacity: l.opacity,
      });
      const inner = new Konva.Group({
        x: l.flipH ? l.width : 0, y: l.flipV ? l.height : 0,
        scaleX: l.flipH ? -1 : 1, scaleY: l.flipV ? -1 : 1,
      });
      const clipFunc = makeClip(l.mask, l.width, l.height, l.cornerRadius);
      const clipped = new Konva.Group({ clipFunc: clipFunc as never });
      let srcW = img.width;
      let srcH = img.height;
      let srcX = 0;
      let srcY = 0;

      if (l.crop) {
        srcW = l.crop.w * img.width;
        srcH = l.crop.h * img.height;
        srcX = l.crop.x * img.width;
        srcY = l.crop.y * img.height;
      }

      const layerAspect = l.width / l.height;
      const srcAspect = srcW / srcH;

      let drawCropW = srcW;
      let drawCropH = srcH;
      let drawCropX = 0;
      let drawCropY = 0;

      if (srcAspect > layerAspect) {
        drawCropW = srcH * layerAspect;
        drawCropX = (srcW - drawCropW) / 2;
      } else {
        drawCropH = srcW / layerAspect;
        drawCropY = (srcH - drawCropH) / 2;
      }

      const finalCrop = {
        cropX: srcX + drawCropX,
        cropY: srcY + drawCropY,
        cropWidth: drawCropW,
        cropHeight: drawCropH,
      };

      clipped.add(new Konva.Image({
        image: img, width: l.width, height: l.height, ...finalCrop,
        shadowBlur: l.shadow?.blur ?? 0,
        shadowOffsetX: l.shadow?.offsetX ?? 0,
        shadowOffsetY: l.shadow?.offsetY ?? 0,
        shadowColor: l.shadow?.color ?? "#000",
        shadowOpacity: l.shadow?.opacity ?? 0,
      }));
      inner.add(clipped);
      group.add(inner);
      if (l.border && l.border.width > 0) {
        group.add(new Konva.Rect({
          x: 0, y: 0, width: l.width, height: l.height,
          stroke: l.border.color, strokeWidth: l.border.width,
          cornerRadius: l.mask === "rounded" ? l.cornerRadius : 0,
        }));
      }
      root.add(group);
    } catch { /* skip */ }
  } else if (l.type === "text") {
    root.add(new Konva.Text({
      x: l.x, y: l.y, width: l.width, rotation: l.rotation, opacity: l.opacity,
      text: l.text, fontFamily: l.fontFamily, fontSize: l.fontSize,
      fontStyle: `${l.fontStyle === "italic" ? "italic " : ""}${l.fontWeight}`,
      fill: l.fill, align: l.align, letterSpacing: l.letterSpacing, lineHeight: l.lineHeight,
      stroke: l.stroke?.color, strokeWidth: l.stroke?.width ?? 0,
      shadowBlur: l.shadow?.blur ?? 0,
      shadowOffsetX: l.shadow?.offsetX ?? 0,
      shadowOffsetY: l.shadow?.offsetY ?? 0,
      shadowColor: l.shadow?.color ?? "#000",
      shadowOpacity: l.shadow?.opacity ?? 0,
    }));
  } else if (l.type === "decoration") {
    try {
      const img = await loadImg(l.src);
      root.add(new Konva.Image({
        image: img, x: l.x, y: l.y, width: l.width, height: l.height,
        rotation: l.rotation, opacity: l.opacity,
        globalCompositeOperation: l.blendMode,
      }));
    } catch { /* skip */ }
  }
}

function makeClip(mask: string, w: number, h: number, r: number) {
  if (mask === "rounded") {
    const rr = Math.min(r, w / 2, h / 2);
    return (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.moveTo(rr, 0);
      ctx.lineTo(w - rr, 0);
      ctx.quadraticCurveTo(w, 0, w, rr);
      ctx.lineTo(w, h - rr);
      ctx.quadraticCurveTo(w, h, w - rr, h);
      ctx.lineTo(rr, h);
      ctx.quadraticCurveTo(0, h, 0, h - rr);
      ctx.lineTo(0, rr);
      ctx.quadraticCurveTo(0, 0, rr, 0);
      ctx.closePath();
    };
  }
  if (mask === "circle") {
    return (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.closePath();
    };
  }
  if (mask === "heart") {
    return (ctx: CanvasRenderingContext2D) => {
      const cx = w / 2;
      const topY = h * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.bezierCurveTo(cx - w * 0.55, topY - h * 0.35, cx - w * 0.55, topY + h * 0.45, cx, h);
      ctx.bezierCurveTo(cx + w * 0.55, topY + h * 0.45, cx + w * 0.55, topY - h * 0.35, cx, topY);
      ctx.closePath();
    };
  }
  return undefined;
}

function downloadCanvas(canvas: HTMLCanvasElement, name: string, format: "png" | "jpg") {
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const url = canvas.toDataURL(mime, format === "jpg" ? 0.92 : undefined);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.${format}`;
  a.click();
}

export async function exportAlbum(opts: ExportOptions) {
  const state = useAlbumStore.getState();
  const album = state.album;
  const pages =
    opts.scope === "all"
      ? album.pages
      : album.pages.filter((p) => p.id === state.activePageId);

  if (opts.format === "pdf") {
    const orientation = album.widthIn >= album.heightIn ? "landscape" : "portrait";
    const pdf = new jsPDF({ unit: "in", orientation, format: [album.widthIn, album.heightIn] });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await renderPageToCanvas(album, pages[i], opts.dpi);
      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([album.widthIn, album.heightIn], orientation);
      pdf.addImage(img, "JPEG", 0, 0, album.widthIn, album.heightIn);
      // Free memory
      canvas.width = 0;
      canvas.height = 0;
    }
    pdf.save(`${album.name || "album"}.pdf`);
  } else {
    for (let i = 0; i < pages.length; i++) {
      const canvas = await renderPageToCanvas(album, pages[i], opts.dpi);
      downloadCanvas(canvas, `${album.name || "album"}-page-${i + 1}`, opts.format);
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
