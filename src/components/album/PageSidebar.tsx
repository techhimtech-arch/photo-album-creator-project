import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PageSidebar() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const setActivePage = useAlbumStore((s) => s.setActivePage);
  const addPage = useAlbumStore((s) => s.addPage);
  const duplicatePage = useAlbumStore((s) => s.duplicatePage);
  const deletePage = useAlbumStore((s) => s.deletePage);
  const movePage = useAlbumStore((s) => s.movePage);

  const aspect = album.widthIn / album.heightIn;

  return (
    <aside className="flex h-full w-44 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pages ({album.pages.length})
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addPage} title="Add page">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {album.pages.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "group relative rounded-md border-2 bg-white overflow-hidden cursor-pointer transition",
              p.id === activePageId ? "border-primary shadow-sm" : "border-transparent hover:border-border",
            )}
            onClick={() => setActivePage(p.id)}
            style={{ aspectRatio: `${aspect}` }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  p.background.kind === "color"
                    ? p.background.color
                    : p.background.kind === "gradient"
                      ? `linear-gradient(${p.background.angle}deg, ${p.background.from}, ${p.background.to})`
                      : "#f3f4f6",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              <span>Page {i + 1}</span>
              <span className="opacity-70">{p.layers.length}L</span>
            </div>
            <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (i > 0) movePage(i, i - 1);
                }}
                className="rounded bg-white/90 p-0.5 hover:bg-white"
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (i < album.pages.length - 1) movePage(i, i + 1);
                }}
                className="rounded bg-white/90 p-0.5 hover:bg-white"
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicatePage(p.id);
                }}
                className="rounded bg-white/90 p-0.5 hover:bg-white"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (album.pages.length > 1 && confirm("Delete this page?")) deletePage(p.id);
                }}
                className="rounded bg-white/90 p-0.5 text-destructive hover:bg-white"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
