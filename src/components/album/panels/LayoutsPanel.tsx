import { useAlbumStore } from "@/lib/album-store";
import { LAYOUTS, type AlbumLayout } from "@/lib/layouts";
import { Button } from "@/components/ui/button";
import { inToEditorPx } from "@/lib/units";
import { uid } from "@/lib/utils-album";
import type { ImageLayer } from "@/types/album";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const CATS: { id: AlbumLayout["category"]; label: string }[] = [
  { id: "1", label: "1 photo" },
  { id: "2", label: "2 photos" },
  { id: "3", label: "3 photos" },
  { id: "4", label: "4 photos" },
  { id: "5", label: "5 photos" },
  { id: "6", label: "6 photos" },
  { id: "collage", label: "Collage" },
];

export default function LayoutsPanel() {
  const [cat, setCat] = useState<AlbumLayout["category"]>("2");
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const photos = useAlbumStore((s) => s.photos);
  const setAlbum = useAlbumStore((s) => s.setAlbum);

  const applyLayout = (layout: AlbumLayout) => {
    const pageWpx = inToEditorPx(album.widthIn);
    const pageHpx = inToEditorPx(album.heightIn);
    if (photos.length === 0) {
      toast({ title: "Add some photos first" });
      return;
    }
    const layers: ImageLayer[] = layout.slots.map((slot, i) => {
      const photo = photos[i % photos.length];
      return {
        id: uid(),
        name: `Slot ${i + 1}`,
        type: "image",
        src: photo.src,
        naturalWidth: photo.width,
        naturalHeight: photo.height,
        x: slot.x * pageWpx,
        y: slot.y * pageHpx,
        width: slot.w * pageWpx,
        height: slot.h * pageHpx,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        mask: "none",
        cornerRadius: 12,
        flipH: false,
        flipV: false,
      };
    });
    setAlbum((a) => ({
      ...a,
      pages: a.pages.map((p) =>
        p.id === activePageId ? { ...p, layers: [...p.layers, ...layers] } : p,
      ),
    }));
    toast({ title: "Layout applied", description: `${layers.length} photos placed.` });
  };

  const aspect = album.widthIn / album.heightIn;
  const filtered = LAYOUTS.filter((l) => l.category === cat);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1 p-2 border-b">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded px-2 py-1 text-xs ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
        {filtered.map((layout) => (
          <button
            key={layout.id}
            onClick={() => applyLayout(layout)}
            className="group relative rounded border bg-white p-1 hover:border-primary"
          >
            <div className="relative w-full" style={{ aspectRatio: aspect }}>
              {layout.slots.map((s, i) => (
                <div
                  key={i}
                  className="absolute bg-primary/30 border border-primary/60"
                  style={{
                    left: `${s.x * 100}%`,
                    top: `${s.y * 100}%`,
                    width: `${s.w * 100}%`,
                    height: `${s.h * 100}%`,
                  }}
                />
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 truncate">{layout.name}</div>
          </button>
        ))}
      </div>
      <div className="border-t p-2 text-[11px] text-muted-foreground">
        Click a layout to place your photos. New layers add on top of the current page.
      </div>
    </div>
  );
}
