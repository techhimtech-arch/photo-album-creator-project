import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PhotoGalleryPanel from "@/components/album/panels/PhotoGalleryPanel";
import PropertiesPanel from "@/components/album/panels/PropertiesPanel";
import TemplateLibraryPanel from "@/components/workflow/TemplateLibraryPanel";
import { Images, Sliders, Library } from "lucide-react";

export default function ProducerRightPanel() {
  const [tab, setTab] = useState("photos");
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <div className="border-b px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30">
        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Quick Produce</p>
        <p className="text-[10px] text-muted-foreground">Load template → upload photos → export PDF</p>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <TabsList className="m-2 grid grid-cols-3 h-9">
          <TabsTrigger value="templates" title="Templates">
            <Library className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="photos" title="Photos">
            <Images className="h-3.5 w-3.5" />
          </TabsTrigger>
          <TabsTrigger value="props" title="Adjust">
            <Sliders className="h-3.5 w-3.5" />
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="templates" className="h-full m-0">
            <TemplateLibraryPanel />
          </TabsContent>
          <TabsContent value="photos" className="h-full m-0">
            <PhotoGalleryPanel />
          </TabsContent>
          <TabsContent value="props" className="h-full m-0">
            <PropertiesPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
