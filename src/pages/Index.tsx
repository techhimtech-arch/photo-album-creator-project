import { useEffect } from "react";
import { useAlbumStore } from "@/lib/album-store";
import { isPhotoSlot } from "@/lib/slot-layers";
import Toolbar from "@/components/album/Toolbar";
import PageSidebar from "@/components/album/PageSidebar";
import EditorCanvas from "@/components/album/EditorCanvas";
import RightPanel from "@/components/album/RightPanel";
import { preloadWeddingFonts } from "@/lib/fonts";

const Index = () => {
  const ready = useAlbumStore((s) => s.ready);
  const bootstrap = useAlbumStore((s) => s.bootstrap);
  const undo = useAlbumStore((s) => s.undo);
  const redo = useAlbumStore((s) => s.redo);
  const deleteLayer = useAlbumStore((s) => s.deleteLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);

  useEffect(() => {
    void bootstrap();
    preloadWeddingFonts();
  }, [bootstrap]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = useAlbumStore.getState();
        if (s.selectedLayerIds.length) {
          for (const id of s.selectedLayerIds) deleteLayer(s.activePageId, id);
          setAlbum((a) => ({ ...a }), true);
        }
      }
      if (e.code === "Space") {
        e.preventDefault();
        const s = useAlbumStore.getState();
        const page = s.album.pages.find((p) => p.id === s.activePageId);
        if (!page) return;
        const slots = page.layers.filter(isPhotoSlot);
        if (slots.length === 0) return;

        let category = slots.length.toString();
        if (slots.length > 6) category = "collage";
        
        // Import LAYOUTS dynamically or from store if available.
        // Actually we need LAYOUTS from @/lib/layouts. Let's do it cleanly:
        import("@/lib/layouts").then(({ LAYOUTS }) => {
          const ALL_LAYOUTS = [...LAYOUTS, ...s.customLayouts];
          const validLayouts = ALL_LAYOUTS.filter((l) => l.category === category);
          if (validLayouts.length > 0) {
            const randomLayout = validLayouts[Math.floor(Math.random() * validLayouts.length)];
            s.applyLayoutToPage(s.activePageId, randomLayout);
          }
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteLayer, setAlbum]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <PageSidebar />
        <EditorCanvas />
        <RightPanel />
      </div>
    </div>
  );
};

export default Index;
