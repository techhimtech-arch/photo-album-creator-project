import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LayoutsPanel from "@/components/album/panels/LayoutsPanel";
import BackgroundPanel from "@/components/album/panels/BackgroundPanel";
import TextPanel from "@/components/album/panels/TextPanel";
import DecorationsPanel from "@/components/album/panels/DecorationsPanel";
import LayersPanel from "@/components/album/panels/LayersPanel";
import PropertiesPanel from "@/components/album/panels/PropertiesPanel";
import TemplateLibraryPanel from "@/components/workflow/TemplateLibraryPanel";
import { LayoutGrid, Palette, Type, Sparkles, Layers, Sliders, Library } from "lucide-react";

export default function DesignerRightPanel() {
  const [tab, setTab] = useState("layouts");
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <TabsList className="m-2 grid grid-cols-4 h-auto gap-1">
          <TabsTrigger value="library" title="Templates" className="text-[10px] px-1 py-1.5">
            <Library className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="layouts" title="Layouts" className="text-[10px] px-1 py-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="background" title="Background" className="text-[10px] px-1 py-1.5">
            <Palette className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="text" title="Text" className="text-[10px] px-1 py-1.5">
            <Type className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="decor" title="Decor" className="text-[10px] px-1 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="layers" title="Layers" className="text-[10px] px-1 py-1.5">
            <Layers className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="props" title="Properties" className="text-[10px] px-1 py-1.5 col-span-2">
            <Sliders className="h-3.5 w-3.5" />
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="library" className="h-full m-0">
            <TemplateLibraryPanel />
          </TabsContent>
          <TabsContent value="layouts" className="h-full m-0">
            <LayoutsPanel />
          </TabsContent>
          <TabsContent value="background" className="h-full m-0">
            <BackgroundPanel />
          </TabsContent>
          <TabsContent value="text" className="h-full m-0">
            <TextPanel />
          </TabsContent>
          <TabsContent value="decor" className="h-full m-0">
            <DecorationsPanel />
          </TabsContent>
          <TabsContent value="layers" className="h-full m-0">
            <LayersPanel />
          </TabsContent>
          <TabsContent value="props" className="h-full m-0">
            <PropertiesPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
