import { useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageBackground } from "@/types/album";
import { fileToDataUrl } from "@/lib/utils-album";

export default function BackgroundPanel() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const updatePageBackground = useAlbumStore((s) => s.updatePageBackground);
  const fileRef = useRef<HTMLInputElement>(null);
  const page = album.pages.find((p) => p.id === activePageId);
  if (!page) return null;
  const bg = page.background;

  const set = (b: PageBackground) => updatePageBackground(page.id, b);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div className="space-y-1">
        <Label>Type</Label>
        <Select
          value={bg.kind}
          onValueChange={(v) => {
            if (v === "color") set({ kind: "color", color: "#ffffff" });
            else if (v === "gradient")
              set({
                kind: "gradient",
                gradient: "linear",
                from: "#fde68a",
                to: "#f472b6",
                angle: 135,
              });
            else set({ kind: "image", src: "", fit: "cover", opacity: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Solid color</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bg.kind === "color" && (
        <div className="space-y-1">
          <Label>Color</Label>
          <Input
            type="color"
            value={bg.color}
            onChange={(e) => set({ kind: "color", color: e.target.value })}
            className="h-10 w-full p-1"
          />
        </div>
      )}

      {bg.kind === "gradient" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={bg.gradient}
              onValueChange={(v) => set({ ...bg, gradient: v as "linear" | "radial" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>From</Label>
              <Input
                type="color"
                value={bg.from}
                onChange={(e) => set({ ...bg, from: e.target.value })}
                className="h-10 w-full p-1"
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="color"
                value={bg.to}
                onChange={(e) => set({ ...bg, to: e.target.value })}
                className="h-10 w-full p-1"
              />
            </div>
          </div>
          {bg.gradient === "linear" && (
            <div>
              <div className="flex justify-between">
                <Label>Angle</Label>
                <span className="text-xs text-muted-foreground">{bg.angle}°</span>
              </div>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[bg.angle]}
                onValueChange={(v) => set({ ...bg, angle: v[0] })}
              />
            </div>
          )}
        </div>
      )}

      {bg.kind === "image" && (
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
            Choose image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const src = await fileToDataUrl(f);
              set({ ...bg, src });
              e.target.value = "";
            }}
          />
          {bg.src && (
            <img src={bg.src} alt="" className="w-full rounded border object-cover max-h-32" />
          )}

          <div className="pt-2">
            <Label className="mb-2 block">Premium Library</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Floral", url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=300&auto=format&fit=crop" },
                { name: "Royal", url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&auto=format&fit=crop" },
                { name: "Bokeh", url: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=300&auto=format&fit=crop" },
                { name: "Dark Luxury", url: "https://images.unsplash.com/photo-1600164318680-a61a9ba22f47?q=80&w=300&auto=format&fit=crop" },
                { name: "Soft Pink", url: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=300&auto=format&fit=crop" },
                { name: "Vintage", url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=300&auto=format&fit=crop" }
              ].map((preset) => (
                <div 
                  key={preset.name}
                  className="aspect-video relative rounded overflow-hidden cursor-pointer border hover:border-primary"
                  onClick={() => set({ ...bg, src: preset.url, fit: "cover", opacity: 1 })}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white px-1 py-0.5 truncate">
                    {preset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Fit</Label>
            <Select value={bg.fit} onValueChange={(v) => set({ ...bg, fit: v as never })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="tile">Tile</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex justify-between">
              <Label>Opacity</Label>
              <span className="text-xs text-muted-foreground">{Math.round(bg.opacity * 100)}%</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[bg.opacity]}
              onValueChange={(v) => set({ ...bg, opacity: v[0] })}
            />
          </div>
        </div>
      )}

      <div className="pt-4 border-t mt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            useAlbumStore.getState().updateAllPagesBackground(bg);
          }}
        >
          Apply to All Pages
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          This will overwrite the background of every page in the album.
        </p>
      </div>
    </div>
  );
}
