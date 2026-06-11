import { useState } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { downloadAlbumTemplate } from "@/lib/album-template";
import PageSidebar from "@/components/album/PageSidebar";
import EditorCanvas from "@/components/album/EditorCanvas";
import ProducerRightPanel from "@/components/workflow/ProducerRightPanel";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportAlbum } from "@/lib/export";
import { toast } from "@/hooks/use-toast";
import { countAlbumSlots } from "@/lib/album-template";

export default function ProducerView() {
  const album = useAlbumStore((s) => s.album);
  const stats = countAlbumSlots(album);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png" | "jpg">("pdf");
  const [exportDpi, setExportDpi] = useState(300);

  const runExport = async () => {
    setExporting(true);
    try {
      await exportAlbum({ format: exportFormat, scope: "all", dpi: exportDpi });
      toast({ title: "Album exported" });
      setExportOpen(false);
    } catch (e) {
      toast({ title: "Export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
        <div className="font-semibold text-sm truncate flex-1">{album.name}</div>
        {stats.total > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {stats.filled}/{stats.total} photos
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            downloadAlbumTemplate(album);
            toast({ title: "Template exported from current album" });
          }}
        >
          <Save className="h-4 w-4 mr-1" /> Save template
        </Button>
        <Button size="sm" onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4 mr-1" /> Export for print
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PageSidebar />
        <EditorCanvas />
        <ProducerRightPanel />
      </div>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export album for print</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "pdf" | "png" | "jpg")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (all pages)</SelectItem>
                  <SelectItem value="png">PNG per page</SelectItem>
                  <SelectItem value="jpg">JPG per page</SelectItem>
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
                  <SelectItem value="150">150 DPI</SelectItem>
                  <SelectItem value="300">300 DPI (print)</SelectItem>
                </SelectContent>
              </Select>
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
    </>
  );
}
