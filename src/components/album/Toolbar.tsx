import { useAlbumStore } from "@/lib/album-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ALBUM_PRESETS, type AlbumSizePreset } from "@/types/album";
import { Undo2, Redo2, Download, Maximize2, Plus, MoreVertical, FilePlus2, Ruler } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportAlbum } from "@/lib/export";
import { toast } from "@/hooks/use-toast";

export default function Toolbar() {
  const album = useAlbumStore((s) => s.album);
  const renameAlbum = useAlbumStore((s) => s.renameAlbum);
  const resizeAlbum = useAlbumStore((s) => s.resizeAlbum);
  const undo = useAlbumStore((s) => s.undo);
  const redo = useAlbumStore((s) => s.redo);
  const canUndo = useAlbumStore((s) => s.canUndo());
  const canRedo = useAlbumStore((s) => s.canRedo());
  const newAlbum = useAlbumStore((s) => s.newAlbum);
  const showGuides = useAlbumStore((s) => s.showGuides);
  const toggleGuides = useAlbumStore((s) => s.toggleGuides);
  const [customW, setCustomW] = useState(album.widthIn);
  const [customH, setCustomH] = useState(album.heightIn);
  const [customOpen, setCustomOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png" | "jpg">("pdf");
  const [exportScope, setExportScope] = useState<"all" | "current">("all");
  const [exportDpi, setExportDpi] = useState(300);
  const [exporting, setExporting] = useState(false);

  const handlePresetChange = (val: string) => {
    if (val === "custom") {
      setCustomOpen(true);
      return;
    }
    resizeAlbum(val as AlbumSizePreset);
  };

  const onFullscreen = async () => {
    const el = document.querySelector("[data-canvas-wrap]") as HTMLElement | null;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const runExport = async () => {
    setExporting(true);
    try {
      await exportAlbum({ format: exportFormat, scope: exportScope, dpi: exportDpi });
      toast({ title: "Export complete" });
    } catch (e) {
      toast({ title: "Export failed", description: (e as Error).message });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="font-semibold">
            <FilePlus2 className="h-4 w-4" />
            Album
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => newAlbum("12x36")}>
            New 12 × 36 album
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => newAlbum("12x24")}>
            New 12 × 24 album
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => newAlbum("12x30")}>
            New 12 × 30 album
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCustomOpen(true)}>
            Custom size…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        value={album.name}
        onChange={(e) => renameAlbum(e.target.value)}
        className="h-8 w-56"
      />

      <Select value={album.preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="h-8 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ALBUM_PRESETS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">
            Custom ({album.widthIn} × {album.heightIn} in)
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="mx-2 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" disabled={!canUndo} onClick={undo} title="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled={!canRedo} onClick={redo} title="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={onFullscreen} title="Fullscreen">
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Button
        variant={showGuides ? "secondary" : "ghost"}
        size="sm"
        onClick={toggleGuides}
        title="Toggle Print Guides (Bleed & Safe Area)"
      >
        <Ruler className="h-4 w-4 mr-2" />
        Guides
      </Button>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (multi-page)</SelectItem>
                  <SelectItem value="png">PNG (one file per page)</SelectItem>
                  <SelectItem value="jpg">JPG (one file per page)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pages</Label>
              <Select value={exportScope} onValueChange={(v) => setExportScope(v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All pages</SelectItem>
                  <SelectItem value="current">Current page only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Resolution</Label>
              <Select value={String(exportDpi)} onValueChange={(v) => setExportDpi(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">150 DPI (preview)</SelectItem>
                  <SelectItem value="300">300 DPI (print)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                300 DPI may use a lot of memory on large albums.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom album size</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Width (in)</Label>
              <Input
                type="number"
                step="0.5"
                value={customW}
                onChange={(e) => setCustomW(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Height (in)</Label>
              <Input
                type="number"
                step="0.5"
                value={customH}
                onChange={(e) => setCustomH(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resizeAlbum("custom", { widthIn: customW, heightIn: customH });
                setCustomOpen(false);
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (confirm("Start a new blank album? Current work will be replaced.")) {
                newAlbum(album.preset, { widthIn: album.widthIn, heightIn: album.heightIn });
              }
            }}
          >
            <Plus className="h-4 w-4" /> New blank album
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
