/** Letterbox/pad an uploaded background image to match the card's exact aspect ratio.
 *
 * Why: the editor maps element coordinates in millimetres against the card's
 * width/height. If the uploaded image has a different aspect ratio, CSS
 * `object-cover` crops it (preview) while jsPDF stretches it (export) — the
 * two no longer agree, so dragged elements look misaligned in the PDF.
 *
 * Fix: re-render the upload onto a canvas sized to (cardW × cardH) at a high
 * pixel density, fitting the original image (contain) and padding the rest
 * with white. The result has the EXACT card aspect ratio, so preview and PDF
 * map coordinates identically.
 */

export interface FitResult {
  dataUrl: string;
  /** True if padding was added (aspect mismatch). */
  padded: boolean;
  /** True if the source was resized down. */
  resized: boolean;
  origW: number;
  origH: number;
}

/** Target px-per-mm for the normalized background (good for print + screen). */
const PX_PER_MM = 12;
/** Hard cap on output dimensions to keep memory sane. */
const MAX_DIM = 2400;

export function fitImageToCard(
  dataUrl: string,
  cardWmm: number,
  cardHmm: number,
  background: string = "#ffffff",
): Promise<FitResult> {
  return new Promise((resolve, reject) => {
    if (!dataUrl) return reject(new Error("No image"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let outW = Math.round(cardWmm * PX_PER_MM);
        let outH = Math.round(cardHmm * PX_PER_MM);
        const scale = Math.min(1, MAX_DIM / Math.max(outW, outH));
        outW = Math.max(1, Math.round(outW * scale));
        outH = Math.max(1, Math.round(outH * scale));

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve({ dataUrl, padded: false, resized: false, origW: img.width, origH: img.height });

        ctx.fillStyle = background;
        ctx.fillRect(0, 0, outW, outH);

        // Contain fit
        const srcAspect = img.width / img.height;
        const dstAspect = outW / outH;
        let dw: number, dh: number;
        if (srcAspect > dstAspect) {
          dw = outW;
          dh = outW / srcAspect;
        } else {
          dh = outH;
          dw = outH * srcAspect;
        }
        const dx = (outW - dw) / 2;
        const dy = (outH - dh) / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, dx, dy, dw, dh);

        const padded = Math.abs(srcAspect - dstAspect) > 0.01;
        const resized = scale < 1 || img.width !== outW || img.height !== outH;
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          padded,
          resized,
          origW: img.width,
          origH: img.height,
        });
      } catch (e) {
        reject(e as Error);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
