import { useEffect, useRef } from "react";
import { useAlbumStore } from "@/lib/album-store";
import type { Layer } from "@/types/album";

// Helper to generate IDs for pasted layers
const uid = () => Math.random().toString(36).slice(2, 10);

export function useKeyboardShortcuts() {
  const selectedIds = useAlbumStore((s) => s.selectedLayerIds);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const deleteLayer = useAlbumStore((s) => s.deleteLayer);
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const addLayer = useAlbumStore((s) => s.addLayer);
  const undo = useAlbumStore((s) => s.undo);
  const redo = useAlbumStore((s) => s.redo);
  const setAlbum = useAlbumStore((s) => s.setAlbum);
  
  // Need to get current album from store without dependency array causing constant re-renders
  const getAlbum = () => useAlbumStore.getState().album;

  const clipboardRef = useRef<Layer[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
        if (e.key === "y") {
          e.preventDefault();
          redo();
          return;
        }

        // Copy
        if (e.key === "c") {
          if (selectedIds.length === 0 || !activePageId) return;
          const album = getAlbum();
          const page = album.pages.find(p => p.id === activePageId);
          if (!page) return;
          
          const layersToCopy = page.layers.filter(l => selectedIds.includes(l.id));
          clipboardRef.current = JSON.parse(JSON.stringify(layersToCopy)); // deep copy
          return;
        }

        // Paste
        if (e.key === "v") {
          if (clipboardRef.current.length === 0 || !activePageId) return;
          e.preventDefault();
          
          const newIds: string[] = [];
          clipboardRef.current.forEach((layer) => {
            const newLayer = { ...layer, id: uid(), x: layer.x + 20, y: layer.y + 20 };
            addLayer(activePageId, newLayer);
            newIds.push(newLayer.id);
            // also update clipboard so pasting again offsets it further
            layer.x += 20;
            layer.y += 20;
          });
          
          useAlbumStore.getState().setSelected(newIds);
          // Commit history
          useAlbumStore.getState().setAlbum((a) => ({ ...a }), true);
          return;
        }
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0 || !activePageId) return;
        e.preventDefault();
        selectedIds.forEach((id) => deleteLayer(activePageId, id));
        useAlbumStore.getState().setAlbum((a) => ({ ...a }), true);
        return;
      }

      // Nudge (Arrow Keys)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (selectedIds.length === 0 || !activePageId) return;
        e.preventDefault();
        
        const amount = e.shiftKey ? 10 : 1;
        const album = getAlbum();
        const page = album.pages.find(p => p.id === activePageId);
        if (!page) return;

        selectedIds.forEach((id) => {
          const layer = page.layers.find(l => l.id === id);
          if (!layer || layer.locked) return;

          let { x, y } = layer;
          if (e.key === "ArrowUp") y -= amount;
          if (e.key === "ArrowDown") y += amount;
          if (e.key === "ArrowLeft") x -= amount;
          if (e.key === "ArrowRight") x += amount;

          updateLayer(activePageId, id, { x, y });
        });

        // We don't commit history for every single arrow key press immediately to avoid flooding history.
        // We'll let the user commit manually or via debounce, but for now we just update state without commit.
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Commit nudge on key up
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (selectedIds.length > 0) {
          useAlbumStore.getState().setAlbum((a) => ({ ...a }), true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedIds, activePageId]);
}
