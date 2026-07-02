import { useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Upload, X, Sparkles, FolderHeart } from "lucide-react";
import { fileToDataUrl, loadImageSize, uid } from "@/lib/utils-album";
import type { DecorationAsset, DecorationLayer } from "@/types/album";
import { inToEditorPx } from "@/lib/units";
import { PRELOADED_DECORATIONS } from "@/lib/preloaded-assets";

export default function DecorationsPanel() {
  const decorations = useAlbumStore((s) => s.decorations);
  const addDecorations = useAlbumStore((s) => s.addDecorations);
  const removeDecoration = useAlbumStore((s) => s.removeDecoration);
  const addLayer = useAlbumStore((s) => s.addLayer);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const album = useAlbumStore((s) => s.album);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = async (files: FileList | null) => {
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

  const placeAsset = (asset: { name: string; src: string; width: number; height: number }) => {
    const pageW = inToEditorPx(album.widthIn);
    const pageH = inToEditorPx(album.heightIn);
    const targetW = pageW * 0.25; // default size (25% of page width)
    const ratio = asset.width / asset.height;
    
    const layer: DecorationLayer = {
      id: uid(),
      name: asset.name,
      type: "decoration",
      src: asset.src,
      naturalWidth: asset.width,
      naturalHeight: asset.height,
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
    <div className="flex h-full flex-col space-y-4">
      {/* Upload button */}
      <div className="p-2 border-b">
        <Button size="sm" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" /> Upload PNG clipart / overlay
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => {
            handleCustomUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-5 custom-scrollbar">
        {/* Preloaded Premium Vector Assets */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Premium Design Vector Assets (Phool Patti)
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {PRELOADED_DECORATIONS.map((asset) => (
              <div
                key={asset.id}
                onClick={() => placeAsset(asset)}
                className="group relative aspect-square cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center p-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                title={`Click to place ${asset.name}`}
              >
                <img src={asset.src} alt={asset.name} className="h-full w-full object-contain filter dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.15)]" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                  <span className="text-[10px] text-white font-medium">Add to Page</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User-uploaded custom decorations */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200">
            <FolderHeart className="h-3.5 w-3.5 text-blue-500" />
            My Uploaded Assets
          </h4>
          
          {decorations.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground py-6 border border-dashed rounded-xl">
              No custom PNGs uploaded yet. Click upload to import your own borders/flowers.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {decorations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => placeAsset(d)}
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
    </div>
  );
}
