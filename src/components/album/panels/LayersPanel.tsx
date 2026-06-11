import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Type,
  Image as ImageIcon,
  Sparkles,
  Frame,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LayersPanel() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const selected = useAlbumStore((s) => s.selectedLayerIds);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const deleteLayer = useAlbumStore((s) => s.deleteLayer);
  const reorderLayer = useAlbumStore((s) => s.reorderLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);

  const page = album.pages.find((p) => p.id === activePageId);
  if (!page) return null;
  // Show top-most first (last in array)
  const layers = page.layers.slice().reverse();

  const commit = () => setAlbum((a) => ({ ...a }), true);
  const sel = selected[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b p-2">
        <Button size="icon" variant="ghost" disabled={!sel} onClick={() => { reorderLayer(page.id, sel, "front"); commit(); }} title="Bring to front">
          <ChevronsUp className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!sel} onClick={() => { reorderLayer(page.id, sel, "forward"); commit(); }} title="Bring forward">
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!sel} onClick={() => { reorderLayer(page.id, sel, "backward"); commit(); }} title="Send backward">
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!sel} onClick={() => { reorderLayer(page.id, sel, "back"); commit(); }} title="Send to back">
          <ChevronsDown className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" disabled={!sel} onClick={() => { deleteLayer(page.id, sel); commit(); }} title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">No layers on this page.</p>
        )}
        {layers.map((l) => {
          const Icon =
            l.type === "text"
              ? Type
              : l.type === "decoration"
                ? Sparkles
                : l.type === "placeholder"
                  ? Frame
                  : ImageIcon;
          return (
            <div
              key={l.id}
              onClick={() => setSelected([l.id])}
              className={cn(
                "flex items-center gap-2 rounded border px-2 py-1.5 text-xs cursor-pointer",
                selected.includes(l.id) ? "border-primary bg-accent" : "border-transparent hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{l.name || l.type}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(page.id, l.id, { visible: !l.visible });
                  commit();
                }}
                className="opacity-60 hover:opacity-100"
              >
                {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(page.id, l.id, { locked: !l.locked });
                  commit();
                }}
                className="opacity-60 hover:opacity-100"
              >
                {l.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
