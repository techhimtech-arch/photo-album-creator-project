import { useState } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Layer, ImageLayer, TextLayer, DecorationLayer, PlaceholderLayer } from "@/types/album";
import { FlipHorizontal2, FlipVertical2, RotateCw } from "lucide-react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PropertiesPanel() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const selected = useAlbumStore((s) => s.selectedLayerIds);
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);

  const page = album.pages.find((p) => p.id === activePageId);
  
  const swapLayers = useAlbumStore((s) => s.swapLayers);
  const setSelected = useAlbumStore((s) => s.setSelected);

  if (page && selected.length === 2) {
    const layerA = page.layers.find((l) => l.id === selected[0]);
    const layerB = page.layers.find((l) => l.id === selected[1]);
    const isPhotoA = layerA && (layerA.type === "image" || layerA.type === "placeholder");
    const isPhotoB = layerB && (layerB.type === "image" || layerB.type === "placeholder");

    if (isPhotoA && isPhotoB) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shadow-inner">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">2 Photo Slots Selected</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              You have selected two photo slots. Click below to swap their photos while maintaining their positions.
            </p>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              swapLayers(page.id, selected[0], selected[1]);
              setSelected([selected[0]]);
              toast({ title: "Photos swapped", description: "Successfully swapped slot contents." });
            }}
          >
            Swap Photo Contents
          </Button>
        </div>
      );
    }
  }

  const layer = page?.layers.find((l) => l.id === selected[0]);
  if (!page || !layer)
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Select a layer on the canvas to edit its properties.
      </div>
    );

  const commit = () => setAlbum((a) => ({ ...a }), true);
  const patch = (p: Partial<Layer>) => updateLayer(page.id, layer.id, p);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={layer.name} onChange={(e) => patch({ name: e.target.value })} onBlur={commit} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="X" value={layer.x} onChange={(v) => patch({ x: v })} onBlur={commit} />
        <NumInput label="Y" value={layer.y} onChange={(v) => patch({ y: v })} onBlur={commit} />
        <NumInput label="W" value={layer.width} onChange={(v) => patch({ width: Math.max(8, v) })} onBlur={commit} />
        <NumInput label="H" value={layer.height} onChange={(v) => patch({ height: Math.max(8, v) })} onBlur={commit} />
      </div>
      <div>
        <div className="flex justify-between">
          <Label>Rotation</Label>
          <span className="text-xs text-muted-foreground">{Math.round(layer.rotation)}°</span>
        </div>
        <Slider min={-180} max={180} step={1} value={[layer.rotation]} onValueChange={(v) => patch({ rotation: v[0] })} onValueCommit={commit} />
      </div>
      <div>
        <div className="flex justify-between">
          <Label>Opacity</Label>
          <span className="text-xs text-muted-foreground">{Math.round(layer.opacity * 100)}%</span>
        </div>
        <Slider min={0} max={1} step={0.01} value={[layer.opacity]} onValueChange={(v) => patch({ opacity: v[0] })} onValueCommit={commit} />
      </div>

      {layer.type === "image" && <ImageProps layer={layer} patch={patch} commit={commit} />}
      {layer.type === "placeholder" && <PlaceholderProps layer={layer} patch={patch} commit={commit} />}
      {layer.type === "text" && <TextProps layer={layer} patch={patch} commit={commit} />}
      {layer.type === "decoration" && <DecorProps layer={layer} patch={patch} commit={commit} />}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
        className="h-8"
      />
    </div>
  );
}

function PlaceholderProps({
  layer,
  patch,
  commit,
}: {
  layer: PlaceholderLayer;
  patch: (p: Partial<Layer>) => void;
  commit: () => void;
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-xs text-muted-foreground">
        Empty photo slot. Click a photo in the gallery to fill this placeholder.
      </p>
      <div>
        <Label>Mask</Label>
        <Select
          value={layer.mask}
          onValueChange={(v) => {
            patch({ mask: v as PlaceholderLayer["mask"] } as Partial<PlaceholderLayer>);
            commit();
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Rectangle</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="heart">Heart</SelectItem>
            <SelectItem value="star">Star</SelectItem>
            <SelectItem value="hexagon">Hexagon</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {layer.mask === "rounded" && (
        <div>
          <div className="flex justify-between">
            <Label>Corner radius</Label>
            <span className="text-xs text-muted-foreground">{layer.cornerRadius}px</span>
          </div>
          <Slider
            min={0}
            max={Math.min(layer.width, layer.height) / 2}
            step={1}
            value={[layer.cornerRadius]}
            onValueChange={(v) => patch({ cornerRadius: v[0] } as Partial<PlaceholderLayer>)}
            onValueCommit={commit}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label>Border</Label>
        <div className="grid grid-cols-[1fr_60px] gap-2">
          <Slider
            min={0}
            max={20}
            step={1}
            value={[layer.border?.width ?? 0]}
            onValueChange={(v) =>
              patch({
                border: { width: v[0], color: layer.border?.color ?? "#ffffff" },
              } as Partial<PlaceholderLayer>)
            }
            onValueCommit={commit}
          />
          <Input
            type="color"
            value={layer.border?.color ?? "#ffffff"}
            onChange={(e) =>
              patch({
                border: { width: layer.border?.width ?? 0, color: e.target.value },
              } as Partial<PlaceholderLayer>)
            }
            onBlur={commit}
            className="h-8 p-1"
          />
        </div>
      </div>
    </div>
  );
}

function ImageProps({
  layer,
  patch,
  commit,
}: {
  layer: ImageLayer;
  patch: (p: Partial<Layer>) => void;
  commit: () => void;
}) {
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [tempCrop, setTempCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const onCropComplete = (croppedArea: { x: number; y: number; width: number; height: number }) => {
    setTempCrop({
      x: croppedArea.x / 100,
      y: croppedArea.y / 100,
      w: croppedArea.width / 100,
      h: croppedArea.height / 100,
    });
  };

  const handleSaveCrop = () => {
    if (tempCrop) {
      patch({ crop: tempCrop } as Partial<ImageLayer>);
      commit();
    }
    setCropOpen(false);
  };

  const handleResetCrop = () => {
    patch({ crop: undefined } as Partial<ImageLayer>);
    commit();
    setCropOpen(false);
  };

  const aspect = layer.width / layer.height;

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex gap-2">
        <Button
          variant={layer.flipH ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => {
            patch({ flipH: !layer.flipH } as Partial<ImageLayer>);
            commit();
          }}
        >
          <FlipHorizontal2 className="h-4 w-4" /> Flip H
        </Button>
        <Button
          variant={layer.flipV ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => {
            patch({ flipV: !layer.flipV } as Partial<ImageLayer>);
            commit();
          }}
        >
          <FlipVertical2 className="h-4 w-4" /> Flip V
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            patch({ rotation: (layer.rotation + 90) % 360 } as Partial<ImageLayer>);
            commit();
          }}
        >
          <RotateCw className="h-4 w-4" /> Rotate 90°
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400"
        onClick={() => {
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCropOpen(true);
        }}
      >
        Crop & Adjust Position
      </Button>

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Crop & Adjust Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative h-64 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
              <Cropper
                image={layer.src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Zoom Photo</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                min={1}
                max={4}
                step={0.1}
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0])}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetCrop} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
              Reset Crop
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCropOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveCrop}>
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <Label>Mask</Label>
        <Select
          value={layer.mask}
          onValueChange={(v) => {
            patch({ mask: v as ImageLayer["mask"] } as Partial<ImageLayer>);
            commit();
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Rectangle</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="heart">Heart</SelectItem>
            <SelectItem value="star">Star</SelectItem>
            <SelectItem value="hexagon">Hexagon</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {layer.mask === "rounded" && (
        <div>
          <div className="flex justify-between">
            <Label>Corner radius</Label>
            <span className="text-xs text-muted-foreground">{layer.cornerRadius}px</span>
          </div>
          <Slider
            min={0}
            max={Math.min(layer.width, layer.height) / 2}
            step={1}
            value={[layer.cornerRadius]}
            onValueChange={(v) => patch({ cornerRadius: v[0] } as Partial<ImageLayer>)}
            onValueCommit={commit}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label>Border</Label>
        <div className="grid grid-cols-[1fr_60px] gap-2">
          <Slider
            min={0}
            max={20}
            step={1}
            value={[layer.border?.width ?? 0]}
            onValueChange={(v) =>
              patch({
                border: { width: v[0], color: layer.border?.color ?? "#ffffff" },
              } as Partial<ImageLayer>)
            }
            onValueCommit={commit}
          />
          <Input
            type="color"
            value={layer.border?.color ?? "#ffffff"}
            onChange={(e) =>
              patch({
                border: { width: layer.border?.width ?? 0, color: e.target.value },
              } as Partial<ImageLayer>)
            }
            onBlur={commit}
            className="h-8 p-1"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Drop shadow</Label>
        <Slider
          min={0}
          max={60}
          step={1}
          value={[layer.shadow?.blur ?? 0]}
          onValueChange={(v) =>
            patch({
              shadow: {
                blur: v[0],
                offsetX: layer.shadow?.offsetX ?? 4,
                offsetY: layer.shadow?.offsetY ?? 6,
                color: layer.shadow?.color ?? "#000000",
                opacity: layer.shadow?.opacity ?? 0.35,
              },
            } as Partial<ImageLayer>)
          }
          onValueCommit={commit}
        />
      </div>
      <div className="space-y-3 pt-3 border-t">
        <Label className="font-semibold block mb-2">Adjustments & Filters</Label>
        
        <div className="flex gap-2 mb-4">
          <Button
            variant={layer.filters?.grayscale ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              patch({ filters: { ...layer.filters, grayscale: !layer.filters?.grayscale } } as Partial<ImageLayer>);
              commit();
            }}
          >
            Grayscale
          </Button>
          <Button
            variant={layer.filters?.sepia ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              patch({ filters: { ...layer.filters, sepia: !layer.filters?.sepia } } as Partial<ImageLayer>);
              commit();
            }}
          >
            Sepia
          </Button>
        </div>

        <div>
          <div className="flex justify-between"><Label>Brightness</Label><span className="text-xs text-muted-foreground">{Math.round((layer.filters?.brightness ?? 0) * 100)}</span></div>
          <Slider min={-1} max={1} step={0.05} value={[layer.filters?.brightness ?? 0]} onValueChange={(v) => patch({ filters: { ...layer.filters, brightness: v[0] } } as Partial<ImageLayer>)} onValueCommit={commit} />
        </div>
        <div>
          <div className="flex justify-between"><Label>Contrast</Label><span className="text-xs text-muted-foreground">{Math.round(layer.filters?.contrast ?? 0)}</span></div>
          <Slider min={-100} max={100} step={1} value={[layer.filters?.contrast ?? 0]} onValueChange={(v) => patch({ filters: { ...layer.filters, contrast: v[0] } } as Partial<ImageLayer>)} onValueCommit={commit} />
        </div>
        <div>
          <div className="flex justify-between"><Label>Blur</Label><span className="text-xs text-muted-foreground">{layer.filters?.blur ?? 0}</span></div>
          <Slider min={0} max={40} step={1} value={[layer.filters?.blur ?? 0]} onValueChange={(v) => patch({ filters: { ...layer.filters, blur: v[0] } } as Partial<ImageLayer>)} onValueCommit={commit} />
        </div>
      </div>
    </div>
  );
}

function TextProps({
  layer,
  patch,
  commit,
}: {
  layer: TextLayer;
  patch: (p: Partial<Layer>) => void;
  commit: () => void;
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <div>
        <Label>Text</Label>
        <textarea
          value={layer.text}
          onChange={(e) => patch({ text: e.target.value } as Partial<TextLayer>)}
          onBlur={commit}
          rows={3}
          className="w-full rounded border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Font</Label>
          <Select
            value={layer.fontFamily}
            onValueChange={(v) => {
              patch({ fontFamily: v } as Partial<TextLayer>);
              commit();
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                "Playfair Display",
                "Cormorant Garamond",
                "Great Vibes",
                "Dancing Script",
                "Cinzel",
                "Montserrat",
                "Lora",
                "Italianno",
                "Parisienne",
                "Tangerine",
                "Inter",
                "Georgia",
              ].map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumInput
          label="Size"
          value={layer.fontSize}
          onChange={(v) => patch({ fontSize: Math.max(6, v) } as Partial<TextLayer>)}
          onBlur={commit}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Color</Label>
          <Input
            type="color"
            value={layer.fill}
            onChange={(e) => patch({ fill: e.target.value } as Partial<TextLayer>)}
            onBlur={commit}
            className="h-9 p-1"
          />
        </div>
        <div>
          <Label>Align</Label>
          <Select
            value={layer.align}
            onValueChange={(v) => {
              patch({ align: v as TextLayer["align"] } as Partial<TextLayer>);
              commit();
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <div className="flex justify-between"><Label>Letter spacing</Label><span className="text-xs text-muted-foreground">{layer.letterSpacing}</span></div>
        <Slider min={-5} max={30} step={0.5} value={[layer.letterSpacing]} onValueChange={(v) => patch({ letterSpacing: v[0] } as Partial<TextLayer>)} onValueCommit={commit} />
      </div>
      <div>
        <div className="flex justify-between"><Label>Curve</Label><span className="text-xs text-muted-foreground">{layer.curve}</span></div>
        <Slider min={-100} max={100} step={1} value={[layer.curve]} onValueChange={(v) => patch({ curve: v[0] } as Partial<TextLayer>)} onValueCommit={commit} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Italic</Label>
        <Switch
          checked={layer.fontStyle === "italic"}
          onCheckedChange={(c) => {
            patch({ fontStyle: c ? "italic" : "normal" } as Partial<TextLayer>);
            commit();
          }}
        />
      </div>
      <div className="space-y-1">
        <Label>Stroke</Label>
        <div className="grid grid-cols-[1fr_60px] gap-2">
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[layer.stroke?.width ?? 0]}
            onValueChange={(v) =>
              patch({
                stroke: { width: v[0], color: layer.stroke?.color ?? "#000000" },
              } as Partial<TextLayer>)
            }
            onValueCommit={commit}
          />
          <Input
            type="color"
            value={layer.stroke?.color ?? "#000000"}
            onChange={(e) =>
              patch({
                stroke: { width: layer.stroke?.width ?? 0, color: e.target.value },
              } as Partial<TextLayer>)
            }
            onBlur={commit}
            className="h-8 p-1"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Drop shadow</Label>
        <Slider
          min={0}
          max={60}
          step={1}
          value={[layer.shadow?.blur ?? 0]}
          onValueChange={(v) =>
            patch({
              shadow: {
                blur: v[0],
                offsetX: layer.shadow?.offsetX ?? 4,
                offsetY: layer.shadow?.offsetY ?? 6,
                color: layer.shadow?.color ?? "#000000",
                opacity: layer.shadow?.opacity ?? 0.35,
              },
            } as Partial<TextLayer>)
          }
          onValueCommit={commit}
        />
      </div>
    </div>
  );
}

function DecorProps({
  layer,
  patch,
  commit,
}: {
  layer: DecorationLayer;
  patch: (p: Partial<Layer>) => void;
  commit: () => void;
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <div>
        <Label>Blend mode</Label>
        <Select
          value={layer.blendMode}
          onValueChange={(v) => {
            patch({ blendMode: v as DecorationLayer["blendMode"] } as Partial<DecorationLayer>);
            commit();
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["source-over", "multiply", "screen", "overlay", "soft-light", "hard-light", "darken", "lighten"] as const).map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
