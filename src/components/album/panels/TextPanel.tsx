import { Button } from "@/components/ui/button";
import { useAlbumStore } from "@/lib/album-store";
import { uid } from "@/lib/utils-album";
import { inToEditorPx } from "@/lib/units";
import type { TextLayer } from "@/types/album";
import { loadFont } from "@/lib/fonts";

const PRESETS: { label: string; text: string; font: string; size: number; fill: string }[] = [
  { label: "Couple names", text: "Aanya & Rohan", font: "Great Vibes", size: 96, fill: "#1f2937" },
  { label: "Wedding date", text: "12 December 2026", font: "Cormorant Garamond", size: 36, fill: "#374151" },
  { label: "Section title", text: "The Wedding", font: "Cinzel", size: 56, fill: "#111827" },
  { label: "Quote", text: '"And they lived happily ever after."', font: "Italianno", size: 52, fill: "#4b5563" },
  { label: "Body", text: "Add your text here.", font: "Lora", size: 24, fill: "#1f2937" },
];

export default function TextPanel() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const addLayer = useAlbumStore((s) => s.addLayer);

  const add = (preset: typeof PRESETS[number]) => {
    void loadFont(preset.font);
    const w = inToEditorPx(album.widthIn) * 0.5;
    const h = preset.size * 1.4;
    const layer: TextLayer = {
      id: uid(),
      name: preset.label,
      type: "text",
      text: preset.text,
      fontFamily: preset.font,
      fontSize: preset.size,
      fontWeight: 400,
      fontStyle: "normal",
      fill: preset.fill,
      align: "center",
      letterSpacing: 0,
      lineHeight: 1.2,
      curve: 0,
      x: (inToEditorPx(album.widthIn) - w) / 2,
      y: (inToEditorPx(album.heightIn) - h) / 2,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    addLayer(activePageId, layer);
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      <p className="text-xs text-muted-foreground">Click to add a preset text to the page. Edit details in Properties.</p>
      {PRESETS.map((p) => (
        <Button
          key={p.label}
          variant="outline"
          className="w-full justify-start h-auto py-2"
          onClick={() => add(p)}
        >
          <div className="text-left">
            <div className="text-xs text-muted-foreground">{p.label}</div>
            <div style={{ fontFamily: p.font }} className="truncate">{p.text}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
