import { useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { isAlbumTemplate, downloadTemplateJson, countAlbumSlots } from "@/lib/album-template";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Upload, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  onApply?: () => void;
  compact?: boolean;
}

export default function TemplateLibraryPanel({ onApply, compact }: Props) {
  const templateLibrary = useAlbumStore((s) => s.templateLibrary);
  const applyAlbumTemplate = useAlbumStore((s) => s.applyAlbumTemplate);
  const addToTemplateLibrary = useAlbumStore((s) => s.addToTemplateLibrary);
  const removeFromTemplateLibrary = useAlbumStore((s) => s.removeFromTemplateLibrary);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleApply = (template: (typeof templateLibrary)[0]) => {
    applyAlbumTemplate(template);
    toast({
      title: "Template loaded",
      description: `${template.pages.length} pages — upload photos and fill placeholders.`,
    });
    onApply?.();
  };

  return (
    <div className={compact ? "space-y-2" : "flex h-full flex-col"}>
      <div className="flex gap-2 p-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.album-template.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              try {
                const json = JSON.parse(ev.target?.result as string);
                if (!isAlbumTemplate(json)) {
                  toast({ title: "Invalid file", variant: "destructive" });
                  return;
                }
                addToTemplateLibrary(json);
                toast({ title: "Template added to library" });
              } catch {
                toast({ title: "Could not read JSON", variant: "destructive" });
              }
            };
            reader.readAsText(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className={compact ? "space-y-2 px-2 pb-2 max-h-64 overflow-y-auto" : "flex-1 overflow-y-auto p-2 space-y-2"}>
        {templateLibrary.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground p-4">
            No templates yet. Convert PSDs in Step 1 or import a .album-template.json file.
          </p>
        ) : (
          templateLibrary.map((t) => {
            const slots = t.pages.reduce(
              (n, p) => n + p.layers.filter((l) => l.type === "placeholder").length,
              0,
            );
            return (
              <div key={t.name} className="rounded border p-2 space-y-2 bg-background">
                <div>
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.pages.length} pages · {slots} photo slots · {t.widthIn}×{t.heightIn} in
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => handleApply(t)}>
                    <Play className="h-3 w-3 mr-1" /> Use
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => downloadTemplateJson(t)}
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromTemplateLibrary(t.name)}
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function TemplateLibrarySummary() {
  const album = useAlbumStore((s) => s.album);
  const stats = countAlbumSlots(album);
  if (stats.total === 0) return null;
  return (
    <div className="text-[10px] text-muted-foreground px-2">
      Current album: {stats.filled}/{stats.total} slots filled
    </div>
  );
}
