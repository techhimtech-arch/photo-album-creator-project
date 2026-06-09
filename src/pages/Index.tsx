import { useEffect } from "react";
import { useAlbumStore } from "@/lib/album-store";
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
