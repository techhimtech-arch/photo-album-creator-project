// All internal canvas coordinates are in INCHES * EDITOR_DPI pixels.
// We render the editor at a lower resolution and only upscale at export time.
export const EDITOR_DPI = 72; // editor working DPI (snappy + low memory)
export const EXPORT_DPI = 300; // print-quality export

export const inToEditorPx = (inches: number) => Math.round(inches * EDITOR_DPI);
export const editorPxToIn = (px: number) => px / EDITOR_DPI;
export const inToExportPx = (inches: number, dpi = EXPORT_DPI) => Math.round(inches * dpi);

export const formatInches = (n: number) =>
  Number.isInteger(n) ? `${n}″` : `${n.toFixed(2)}″`;
