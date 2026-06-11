import { useRef, useState } from "react";
import { useAlbumStore } from "@/lib/album-store";
import {
  parsePsdFile,
  buildTemplateFromPsdPages,
  type PsdParseResult,
} from "@/lib/psd-import";
import { downloadTemplateJson } from "@/lib/album-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Save, Trash2, FileImage } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Page } from "@/types/album";

export default function ConverterView() {
  const addToTemplateLibrary = useAlbumStore((s) => s.addToTemplateLibrary);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dpi, setDpi] = useState(300);
  const [templateName, setTemplateName] = useState("Wedding Album Template");
  const [parsedPages, setParsedPages] = useState<PsdParseResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    const results: PsdParseResult[] = [];
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".psd")) continue;
      try {
        results.push(await parsePsdFile(file, dpi));
      } catch (e) {
        toast({
          title: `Failed: ${file.name}`,
          description: (e as Error).message,
          variant: "destructive",
        });
      }
    }
    setParsedPages((prev) => [...prev, ...results]);
    if (results.length) {
      toast({ title: `${results.length} PSD sheet(s) converted` });
      if (!templateName || templateName === "Wedding Album Template") {
        const base = results[0].fileName.replace(/\.psd$/i, "");
        setTemplateName(base);
      }
    }
    setLoading(false);
  };

  const buildTemplate = () => {
    if (!parsedPages.length) return null;
    const first = parsedPages[0];
    const pages: Omit<Page, "id">[] = parsedPages.map((p) => p.page);
    return buildTemplateFromPsdPages(
      templateName,
      pages,
      first.widthIn,
      first.heightIn,
      first.preset,
      dpi,
    );
  };

  const saveToLibrary = () => {
    const t = buildTemplate();
    if (!t) return;
    addToTemplateLibrary(t);
    toast({ title: "Saved to template library", description: "Open Step 3 to use it." });
  };

  const downloadJson = () => {
    const t = buildTemplate();
    if (!t) return;
    downloadTemplateJson(t);
    toast({ title: "JSON downloaded" });
  };

  const totalSlots = parsedPages.reduce(
    (n, p) => n + p.page.layers.filter((l) => l.type === "placeholder").length,
    0,
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-full max-w-lg border-r flex flex-col bg-card overflow-y-auto">
        <div className="p-4 space-y-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">PSD → JSON Template</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Upload album PSD sheets. Smart Objects &amp; layers named photo/img become placeholders.
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Print DPI (usually 300)</Label>
            <Input
              type="number"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value) || 300)}
              className="h-8"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Template name</Label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="h-8" />
          </div>

          <Button
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Converting…" : "Upload PSD file(s)"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".psd"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {parsedPages.length > 0 && (
          <div className="p-4 space-y-3 border-b">
            <div className="text-sm font-medium">
              {parsedPages.length} page(s) · {totalSlots} photo slots detected
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={saveToLibrary}>
                <Save className="h-4 w-4 mr-1" /> Save to library
              </Button>
              <Button size="sm" onClick={downloadJson}>
                <Download className="h-4 w-4 mr-1" /> Download JSON
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-destructive"
              onClick={() => setParsedPages([])}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Clear all
            </Button>
          </div>
        )}

        <div className="flex-1 p-2 space-y-2">
          {parsedPages.map((p, i) => (
            <div key={`${p.fileName}-${i}`} className="rounded border p-2 text-xs space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <FileImage className="h-3.5 w-3.5" />
                <span className="truncate">{p.fileName}</span>
              </div>
              <div className="text-muted-foreground">
                {p.widthIn}×{p.heightIn} in ·{" "}
                {p.page.layers.filter((l) => l.type === "placeholder").length} slots ·{" "}
                {p.page.layers.filter((l) => l.type === "text").length} text
              </div>
              <ul className="text-[10px] text-muted-foreground max-h-24 overflow-y-auto">
                {p.layers
                  .filter((l) => l.included)
                  .map((l) => (
                    <li key={l.id}>
                      {l.kind === "photo-slot" ? "📷" : "T"} {l.name}
                    </li>
                  ))}
              </ul>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() => setParsedPages((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-muted/20">
        <div className="max-w-xl space-y-4">
          <h3 className="font-semibold">How this step works</h3>
          <ol className="text-sm space-y-3 list-decimal list-inside text-muted-foreground">
            <li>
              <strong className="text-foreground">Designer</strong> uploads PSD sheets (one PSD = one
              album page/spread).
            </li>
            <li>
              App detects <strong className="text-foreground">Smart Objects</strong> and layers named
              photo/img as placeholders.
            </li>
            <li>
              Text layers are copied. Background defaults to white (add in Step 2 if needed).
            </li>
            <li>
              Click <strong className="text-foreground">Save to library</strong> or{" "}
              <strong className="text-foreground">Download JSON</strong> to share with the team.
            </li>
            <li>
              <strong className="text-foreground">Operator</strong> uses Step 3 — load template, upload
              photos, export PDF.
            </li>
          </ol>
          <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> For best results, name photo layers clearly
            in Photoshop (Photo 1, IMG, Smart Object). Send us PSDs when ready — we can tune detection
            rules for your files.
          </div>
        </div>
      </div>
    </div>
  );
}
