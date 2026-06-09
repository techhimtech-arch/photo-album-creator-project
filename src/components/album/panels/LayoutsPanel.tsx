import { useAlbumStore } from "@/lib/album-store";
import { LAYOUTS, type AlbumLayout } from "@/lib/layouts";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Download, Upload as UploadIcon, Trash2, Save } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type TabCategory = AlbumLayout["category"] | "custom";

const CATS: { id: TabCategory; label: string }[] = [
  { id: "1", label: "1 photo" },
  { id: "2", label: "2 photos" },
  { id: "3", label: "3 photos" },
  { id: "4", label: "4 photos" },
  { id: "5", label: "5 photos" },
  { id: "6", label: "6 photos" },
  { id: "collage", label: "Collage" },
  { id: "custom", label: "Custom" },
];

export default function LayoutsPanel() {
  const [cat, setCat] = useState<TabCategory>("2");
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const customLayouts = useAlbumStore((s) => s.customLayouts);
  const savePageAsLayout = useAlbumStore((s) => s.savePageAsLayout);
  const addCustomLayout = useAlbumStore((s) => s.addCustomLayout);
  const deleteCustomLayout = useAlbumStore((s) => s.deleteCustomLayout);
  const applyLayoutToPage = useAlbumStore((s) => s.applyLayoutToPage);
  const layoutGap = useAlbumStore((s) => s.layoutGap);
  const setLayoutGap = useAlbumStore((s) => s.setLayoutGap);

  const fileRef = useRef<HTMLInputElement>(null);

  const applyLayout = (layout: AlbumLayout) => {
    if (!activePageId) return;
    applyLayoutToPage(activePageId, layout);
    toast({ title: "Layout applied", description: `Reorganized page to match layout.` });
  };

  const handleSaveCurrentPage = () => {
    if (!activePageId) return;
    savePageAsLayout(activePageId, `My Layout ${customLayouts.length + 1}`);
    setCat("custom");
    toast({ title: "Layout Saved", description: "Your page has been saved as a custom layout." });
  };

  const handleExport = (e: React.MouseEvent, layout: AlbumLayout) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${layout.name}.json`);
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.id && json.slots) {
          // generate a new id to avoid collisions
          json.id = `custom-${Math.random().toString(36).slice(2, 10)}`;
          addCustomLayout(json as AlbumLayout);
          setCat("custom");
          toast({ title: "Layout Imported", description: "Successfully imported custom layout." });
        }
      } catch (err) {
        toast({ title: "Import Failed", description: "Invalid layout file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const aspect = album.widthIn / album.heightIn;
  
  const allLayouts = [...LAYOUTS, ...customLayouts];
  const filtered = cat === "custom" 
    ? customLayouts 
    : allLayouts.filter((l) => l.category === cat && !l.id.startsWith("custom-"));

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

      <div className="p-3 border-b space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">Layout Spacing</Label>
          <span className="text-xs text-muted-foreground">{layoutGap}px</span>
        </div>
        <Slider 
          min={0} 
          max={60} 
          step={2} 
          value={[layoutGap]} 
          onValueChange={(v) => setLayoutGap(v[0])} 
        />
        <div className="text-[10px] text-muted-foreground text-center">Applies to applied layouts and Auto-Fill</div>
      </div>
      
      {cat === "custom" && (
        <div className="grid grid-cols-2 gap-2 p-2 border-b">
          <Button size="sm" variant="outline" onClick={handleSaveCurrentPage}>
            <Save className="h-4 w-4 mr-2" /> Save Page
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <UploadIcon className="h-4 w-4 mr-2" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
        {filtered.length === 0 && cat === "custom" && (
          <div className="col-span-2 text-center text-xs text-muted-foreground p-4">
            No custom layouts yet. Save a page or import one!
          </div>
        )}
        {filtered.map((layout) => (
          <button
            key={layout.id}
            onClick={() => applyLayout(layout)}
            className="group relative rounded border bg-white p-1 hover:border-primary flex flex-col items-center"
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
            <div className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">{layout.name}</div>
            
            {layout.id.startsWith("custom-") && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/80 p-0.5 rounded shadow-sm">
                <div
                  onClick={(e) => handleExport(e, layout)}
                  className="p-1 hover:bg-muted rounded cursor-pointer text-blue-600"
                  title="Export Layout"
                >
                  <Download className="h-3 w-3" />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomLayout(layout.id);
                  }}
                  className="p-1 hover:bg-muted rounded cursor-pointer text-red-600"
                  title="Delete Layout"
                >
                  <Trash2 className="h-3 w-3" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="border-t p-2 text-[11px] text-muted-foreground">
        Click a layout to rearrange the photos on your current page.
      </div>
    </div>
  );
}
