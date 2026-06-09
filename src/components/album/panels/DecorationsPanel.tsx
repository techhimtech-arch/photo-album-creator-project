import { useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { fileToDataUrl, loadImageSize, uid } from "@/lib/utils-album";
import type { DecorationAsset, DecorationLayer } from "@/types/album";
import { inToEditorPx } from "@/lib/units";

export default function DecorationsPanel() {
  const decorations = useAlbumStore((s) => s.decorations);
  const addDecorations = useAlbumStore((s) => s.addDecorations);
  const removeDecoration = useAlbumStore((s) => s.removeDecoration);
  const addLayer = useAlbumStore((s) => s.addLayer);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const album = useAlbumStore((s) => s.album);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files) return;
    const out: DecorationAsset[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const src = await fileToDataUrl(f);
      const { width, height } = await loadImageSize(src);
      out.push({ id: uid(), name: f.name, src, width, height, addedAt: Date.now() });
    }
    addDecorations(out);
  };

  const place = (d: DecorationAsset) => {
    const pageW = inToEditorPx(album.widthIn);
    const pageH = inToEditorPx(album.heightIn);
    const targetW = pageW * 0.3;
    const ratio = d.width / d.height;
    const layer: DecorationLayer = {
      id: uid(),
      name: d.name,
      type: "decoration",
      src: d.src,
      naturalWidth: d.width,
      naturalHeight: d.height,
      x: (pageW - targetW) / 2,
      y: (pageH - targetW / ratio) / 2,
      width: targetW,
      height: targetW / ratio,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: "source-over",
    };
    addLayer(activePageId, layer);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-2 border-b">
        <Button size="sm" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload PNG / overlay
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {decorations.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            Upload flowers, ornaments, light leaks, or PNG overlays.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {decorations.map((d) => (
              <div
                key={d.id}
                onClick={() => place(d)}
                className="group relative aspect-square cursor-pointer rounded border bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0]"
              >
                <img src={d.src} alt={d.name} className="h-full w-full object-contain" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDecoration(d.id);
                  }}
                  className="absolute right-0.5 top-0.5 rounded bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
