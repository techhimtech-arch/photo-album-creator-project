import { useRef, useState } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { countAlbumSlots } from "@/lib/album-template";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, X, Wand2, Zap } from "lucide-react";
import { fileToDataUrl, loadImageSize, uid } from "@/lib/utils-album";
import type { ImageLayer, PhotoAsset } from "@/types/album";
import { inToEditorPx } from "@/lib/units";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function PhotoGalleryPanel() {
  const rawPhotos = useAlbumStore((s) => s.photos);
  const addPhotos = useAlbumStore((s) => s.addPhotos);
  const removePhoto = useAlbumStore((s) => s.removePhoto);
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const addLayer = useAlbumStore((s) => s.addLayer);
  const fillPlaceholder = useAlbumStore((s) => s.fillPlaceholder);
  const fillAllPlaceholders = useAlbumStore((s) => s.fillAllPlaceholders);
  const selectedLayerIds = useAlbumStore((s) => s.selectedLayerIds);
  const autoFillAlbum = useAlbumStore((s) => s.autoFillAlbum);
  const photoSort = useAlbumStore((s) => s.photoSort);
  const setPhotoSort = useAlbumStore((s) => s.setPhotoSort);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const slotStats = countAlbumSlots(album);
  const fillProgress =
    slotStats.total > 0 ? Math.round((slotStats.filled / slotStats.total) * 100) : 0;

  const handleFiles = async (files: FileList | null, autoFill = false) => {
    if (!files || files.length === 0) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) {
      toast({ title: "No images found", description: "Only image files are imported." });
      return;
    }
    const results: PhotoAsset[] = [];
    for (const f of imgs) {
      try {
        const src = await fileToDataUrl(f);
        const { width, height } = await loadImageSize(src);
        results.push({
          id: uid(),
          name: f.name,
          src,
          width,
          height,
          addedAt: Date.now(),
        });
      } catch {
        /* skip */
      }
    }
    addPhotos(results);
    toast({ title: `${results.length} photos added` });

    if (autoFill && slotStats.empty > 0) {
      setTimeout(() => {
        const r = fillAllPlaceholders();
        if (r.filled > 0) {
          toast({
            title: "Photos placed",
            description: `${r.filled} slots filled across the album.`,
          });
        }
      }, 0);
    }
  };

  const placePhotoOnPage = async (photo: PhotoAsset) => {
    const page = album.pages.find((p) => p.id === activePageId);
    if (!page) return;

    const selectedPlaceholder = page.layers.find(
      (l) => l.type === "placeholder" && selectedLayerIds.includes(l.id),
    );
    if (selectedPlaceholder) {
      fillPlaceholder(activePageId, selectedPlaceholder.id, photo);
      toast({ title: "Photo placed", description: `Filled ${selectedPlaceholder.name}.` });
      return;
    }

    const firstEmpty = page.layers.find((l) => l.type === "placeholder");
    if (firstEmpty) {
      fillPlaceholder(activePageId, firstEmpty.id, photo);
      toast({ title: "Photo placed", description: `Filled ${firstEmpty.name}.` });
      return;
    }

    const pageWpx = inToEditorPx(album.widthIn);
    const pageHpx = inToEditorPx(album.heightIn);
    const maxW = pageWpx * 0.4;
    const maxH = pageHpx * 0.6;
    const ratio = photo.width / photo.height;
    let w = maxW;
    let h = maxW / ratio;
    if (h > maxH) {
      h = maxH;
      w = maxH * ratio;
    }
    const layer: ImageLayer = {
      id: uid(),
      name: photo.name,
      type: "image",
      src: photo.src,
      naturalWidth: photo.width,
      naturalHeight: photo.height,
      x: (pageWpx - w) / 2,
      y: (pageHpx - h) / 2,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      mask: "none",
      cornerRadius: 16,
      flipH: false,
      flipV: false,
    };
    addLayer(activePageId, layer);
  };

  const [filter, setFilter] = useState<"all" | "unused">("unused");

  const usedSrcs = new Set<string>();
  album.pages.forEach((p) =>
    p.layers.forEach((l) => {
      if (l.type === "image") usedSrcs.add(l.src);
    }),
  );

  const photos = [...rawPhotos].filter((p) => filter === "all" || !usedSrcs.has(p.src)).sort((a, b) => {
    if (photoSort === "name") {
      return a.name.localeCompare(b.name);
    }
    return b.addedAt - a.addedAt;
  });

  const handleFillAll = () => {
    const r = fillAllPlaceholders();
    if (r.filled === 0) {
      toast({
        title: "Nothing to fill",
        description:
          slotStats.empty === 0
            ? "No empty placeholders on this album."
            : "Upload photos first, then fill placeholders.",
        variant: "destructive",
      });
      return;
    }
    let desc = `${r.filled} photo${r.filled === 1 ? "" : "s"} placed in placeholders.`;
    if (r.emptyLeft > 0) desc += ` ${r.emptyLeft} slots still empty.`;
    if (r.photosLeft > 0) desc += ` ${r.photosLeft} extra photos unused.`;
    toast({ title: "Album filled", description: desc });
  };

  return (
    <div className="flex h-full flex-col">
      {slotStats.total > 0 && (
        <div className="border-b bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Album progress</span>
            <span className="text-muted-foreground">
              {slotStats.filled}/{slotStats.total} photos placed
            </span>
          </div>
          <Progress value={fillProgress} className="h-2" />
          {slotStats.empty > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {slotStats.empty} empty slot{slotStats.empty === 1 ? "" : "s"} waiting for photos
            </p>
          )}
          {slotStats.empty > 0 && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={handleFillAll}
              disabled={photos.length === 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              Fill All Placeholders
            </Button>
          )}
          {slotStats.filled === slotStats.total && slotStats.total > 0 && (
            <p className="text-[10px] text-emerald-700 font-medium text-center">
              All slots filled — adjust crops & export
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-2">
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
        <Button size="sm" variant="outline" onClick={() => folderRef.current?.click()}>
          <FolderOpen className="h-4 w-4" /> Folder
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, slotStats.empty > 0);
            e.target.value = "";
          }}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          // @ts-expect-error non-standard but supported
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, slotStats.empty > 0);
            e.target.value = "";
          }}
        />
      </div>

      {slotStats.total === 0 && (
        <div className="mx-2 mb-2 rounded border border-dashed bg-muted/20 p-3 text-[10px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Quick workflow:</strong> Album menu → Load template →
          upload photos here → Fill All Placeholders → Export PDF.
        </div>
      )}

      {photos.length > 0 && (
        <div className="px-2 pb-2 space-y-2">
          <div className="flex gap-2">
            <Select value={photoSort} onValueChange={(v) => setPhotoSort(v as "time" | "name")}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time" className="text-xs">Upload order</SelectItem>
                <SelectItem value="name" className="text-xs">A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "unused")}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unused" className="text-xs">Unused Queue</SelectItem>
                <SelectItem value="all" className="text-xs">All Photos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            size="sm"
            variant="outline"
            onClick={() => {
              autoFillAlbum(photos);
              toast({
                title: "New pages created",
                description: "Creates extra pages — use only without a template.",
              });
            }}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-Fill (new pages)
          </Button>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files, slotStats.empty > 0);
        }}
      >
        {photos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground p-6">
            {slotStats.empty > 0
              ? "Upload client photos — they will auto-fill placeholders."
              : "Drop photos here or click Upload."}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded border bg-muted cursor-pointer"
                onClick={() => placePhotoOnPage(p)}
                title="Click to fill next placeholder on this page"
              >
                <img src={p.src} alt={p.name} className="h-full w-full object-cover" />
                {usedSrcs.has(p.src) && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                    <div className="bg-green-600 text-white rounded-full p-1 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(p.id);
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
