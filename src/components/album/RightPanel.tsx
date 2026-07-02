import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PhotoGalleryPanel from "./panels/PhotoGalleryPanel";
import LayersPanel from "./panels/LayersPanel";
import BackgroundPanel from "./panels/BackgroundPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import LayoutsPanel from "./panels/LayoutsPanel";
import TextPanel from "./panels/TextPanel";
import DecorationsPanel from "./panels/DecorationsPanel";
import ThemePanel from "./panels/ThemePanel";
import { Images, Layers, Palette, Sliders, LayoutGrid, Type, Sparkles, Brush } from "lucide-react";

export default function RightPanel() {
  const [tab, setTab] = useState("photos");
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <TabsList className="m-2 grid grid-cols-8 h-9 gap-0.5">
          <TabsTrigger value="photos" title="Photos" className="p-1"><Images className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="layouts" title="Layouts" className="p-1"><LayoutGrid className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="theme" title="Themes" className="p-1"><Brush className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="background" title="Background" className="p-1"><Palette className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="text" title="Text" className="p-1"><Type className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="decor" title="Decorations" className="p-1"><Sparkles className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="layers" title="Layers" className="p-1"><Layers className="h-3.5 w-3.5" /></TabsTrigger>
          <TabsTrigger value="props" title="Properties" className="p-1"><Sliders className="h-3.5 w-3.5" /></TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="photos" className="h-full m-0"><PhotoGalleryPanel /></TabsContent>
          <TabsContent value="layouts" className="h-full m-0"><LayoutsPanel /></TabsContent>
          <TabsContent value="theme" className="h-full m-0"><ThemePanel /></TabsContent>
          <TabsContent value="background" className="h-full m-0"><BackgroundPanel /></TabsContent>
          <TabsContent value="text" className="h-full m-0"><TextPanel /></TabsContent>
          <TabsContent value="decor" className="h-full m-0"><DecorationsPanel /></TabsContent>
          <TabsContent value="layers" className="h-full m-0"><LayersPanel /></TabsContent>
          <TabsContent value="props" className="h-full m-0"><PropertiesPanel /></TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
