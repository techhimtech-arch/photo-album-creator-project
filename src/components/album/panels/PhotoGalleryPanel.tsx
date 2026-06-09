import { useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, X } from "lucide-react";
import { fileToDataUrl, loadImageSize, uid } from "@/lib/utils-album";
import type { ImageLayer, PhotoAsset } from "@/types/album";
import { inToEditorPx } from "@/lib/units";
import { toast } from "@/hooks/use-toast";

export default function PhotoGalleryPanel() {
  const photos = useAlbumStore((s) => s.photos);
  const addPhotos = useAlbumStore((s) => s.addPhotos);
  const removePhoto = useAlbumStore((s) => s.removePhoto);
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const addLayer = useAlbumStore((s) => s.addLayer);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
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
  };

  const placePhotoOnPage = async (photo: PhotoAsset) => {
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

  return (
    <div className="flex h-full flex-col">
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
            handleFiles(e.target.files);
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
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <div
        className="flex-1 overflow-y-auto p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {photos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground p-6">
            Drop photos here or click Upload.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded border bg-muted cursor-pointer"
                onClick={() => placePhotoOnPage(p)}
                title={`Click to add to page`}
              >
                <img src={p.src} alt={p.name} className="h-full w-full object-cover" />
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
