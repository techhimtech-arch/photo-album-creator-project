import { useRef, useState } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { parsePsdFile, buildTemplateFromPsdPages, type PsdParseResult } from "@/lib/psd-import";
import { downloadTemplateJson } from "@/lib/album-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, Save, Trash2, FileImage, Sparkles, Layers, Image as ImageIcon, Type } from "lucide-react";
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

  const toggleLayerIncluded = (pageIdx: number, layerId: string) => {
    setParsedPages(prev => {
      const next = [...prev];
      const p = { ...next[pageIdx] };
      p.layers = p.layers.map(l => l.id === layerId ? { ...l, included: !l.included } : l);
      next[pageIdx] = p;
      return next;
    });
  };

  const buildTemplate = () => {
    if (!parsedPages.length) return null;
    const first = parsedPages[0];
    
    // Filter page layers based on the included state from layerInfos
    const pages: Omit<Page, "id">[] = parsedPages.map((p) => {
      const filteredLayers = p.page.layers.filter((_, idx) => p.layers[idx]?.included);
      return { ...p.page, layers: filteredLayers };
    });

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
    (n, p) => n + p.layers.filter(l => l.included && l.kind !== "text").length,
    0,
  );

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Premium Glass Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg flex flex-col z-10 glass-panel shadow-2xl border-r border-white/20">
        <div className="p-6 space-y-6 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              PSD Import Studio
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload Photoshop files to auto-extract frames &amp; text.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Print DPI</Label>
              <Input
                type="number"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value) || 300)}
                className="h-9 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Template Name</Label>
              <Input 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                className="h-9 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-white/20" 
              />
            </div>
          </div>

          <div 
            className="group relative border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-500 overflow-hidden"
            onClick={() => fileRef.current?.click()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Upload className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {loading ? "Analyzing PSD files..." : "Drag & Drop or Click to Upload"}
            </div>
            <div className="text-xs text-slate-500 mt-1">Supports multiple .psd files</div>
          </div>
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
          <div className="p-4 space-y-4 border-b border-white/10 bg-white/30 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                {parsedPages.length} Pages • {totalSlots} Slots
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setParsedPages([])}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={saveToLibrary} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                <Save className="h-4 w-4 mr-2" /> Save Library
              </Button>
              <Button variant="outline" onClick={downloadJson} className="bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 border-white/20">
                <Download className="h-4 w-4 mr-2" /> Export JSON
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {parsedPages.map((p, i) => (
            <div key={`${p.fileName}-${i}`} className="rounded-xl border border-white/20 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <FileImage className="h-4 w-4 text-blue-500" />
                  <span className="truncate max-w-[200px]" title={p.fileName}>{p.fileName}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => setParsedPages((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="text-xs text-slate-500 font-medium flex gap-3">
                <span>{p.widthIn}" × {p.heightIn}"</span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Detected Layers</div>
                {p.layers.map((l) => (
                  <div key={l.id} className={`flex items-center justify-between p-1.5 rounded-md text-xs transition-colors ${l.included ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      {l.kind === "text" ? <Type className="h-3 w-3 text-emerald-500" /> : <ImageIcon className="h-3 w-3 text-blue-500" />}
                      <span className="truncate max-w-[150px] font-medium" title={l.name}>{l.name}</span>
                    </div>
                    <Switch 
                      checked={l.included} 
                      onCheckedChange={() => toggleLayerIncluded(i, l.id)}
                      className="scale-75 data-[state=checked]:bg-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto relative z-0 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 space-y-6 shadow-2xl transform transition-all hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg mb-6">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Smart PSD Import</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            We automatically scan your PSD layers and convert Rectangles, Shapes, and Smart Objects into photo slots.
          </p>
          
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Troubleshooting</h4>
            <ul className="text-sm space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                <span>If a frame is missing, find it in the "Detected Layers" list and toggle it ON.</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                <span>Background layers are automatically skipped to avoid making them placeholders.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
