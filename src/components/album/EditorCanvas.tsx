import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Group, Line, Text as KonvaText, Transformer as KonvaTransformer } from "react-konva";
import Konva from "konva";
import { useAlbumStore } from "@/lib/album-store";
import { inToEditorPx } from "@/lib/units";
import type { Page } from "@/types/album";
import PageBackgroundNode from "./layers/PageBackgroundNode";
import ImageLayerNode from "./layers/ImageLayerNode";
import PlaceholderLayerNode from "./layers/PlaceholderLayerNode";
import TextLayerNode from "./layers/TextLayerNode";
import DecorationLayerNode from "./layers/DecorationLayerNode";
import { getSnapLines } from "@/lib/snapping";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function EditorCanvas() {
  const album = useAlbumStore((s) => s.album);
  const activePageId = useAlbumStore((s) => s.activePageId);
  const zoom = useAlbumStore((s) => s.zoom);
  const fitMode = useAlbumStore((s) => s.fitMode);
  const showGuides = useAlbumStore((s) => s.showGuides);
  const setZoom = useAlbumStore((s) => s.setZoom);
  const setFitMode = useAlbumStore((s) => s.setFitMode);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const selected = useAlbumStore((s) => s.selectedLayerIds);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [snapLines, setSnapLines] = useState<{ xLine?: number; yLine?: number; type: "h" | "v"; length: number }[]>([]);
  const snapLinesKeyRef = useRef<string>("");

  useKeyboardShortcuts();

  const page: Page | undefined = album.pages.find((p) => p.id === activePageId);

  // Determine if all selected layers should keep aspect ratio (images/placeholders/decorations)
  const keepRatio = (() => {
    if (!page || selected.length === 0) return false;
    const sel = page.layers.filter((l) => selected.includes(l.id));
    if (sel.length === 0) return false;
    return sel.every((l) => l.type === "image" || l.type === "placeholder" || l.type === "decoration");
  })();

  const pageW = inToEditorPx(album.widthIn);
  const pageH = inToEditorPx(album.heightIn);
  
  const pageIndex = album.pages.findIndex((p) => p.id === activePageId);
  const pageNumberString = `— Page ${pageIndex + 1} —`;

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = wrapRef.current!.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-fit zoom
  const fitScale = size.w && size.h
    ? Math.min((size.w - 80) / pageW, (size.h - 80) / pageH, 4)
    : 1;
  const scale = fitMode === "fit" ? fitScale : zoom;

  // Update transformer when selection changes
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selected
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selected, activePageId, album]);

  if (!page) return <div className="flex-1 grid place-items-center text-muted-foreground">No page</div>;

  const stageW = size.w || 800;
  const stageH = size.h || 600;
  const offsetX = (stageW - pageW * scale) / 2;
  const offsetY = (stageH - pageH * scale) / 2;

  const bleedPx = inToEditorPx(0.125);
  const safePx = inToEditorPx(0.375);

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden bg-muted/30" data-canvas-wrap>
      <Stage
        ref={stageRef}
        width={stageW}
        height={stageH}
        onMouseDown={(e) => {
          // click on empty area to deselect
          if (e.target === e.target.getStage()) setSelected([]);
          if (e.target.attrs?.name === "page-bg") setSelected([]);
        }}
        onWheel={(e) => {
          if (!e.evt.ctrlKey && !e.evt.metaKey) return;
          e.evt.preventDefault();
          const delta = -e.evt.deltaY * 0.001;
          setZoom(scale + delta);
        }}
        onDragMove={(e) => {
          const node = e.target;
          if (node.name() === "page-bg" || node.className === "Transformer" || node.name() === "_anchor") {
            if (snapLinesKeyRef.current !== "") {
              snapLinesKeyRef.current = "";
              setSnapLines([]);
            }
            return;
          }
          const lines = getSnapLines(node, pageW, pageH, [], 5 / scale);
          // Dedupe: only setState if guide positions actually changed (avoids 60fps re-render thrash)
          const key = lines.map((l) => `${l.type}:${l.xLine ?? l.yLine}`).join("|");
          if (key !== snapLinesKeyRef.current) {
            snapLinesKeyRef.current = key;
            setSnapLines(lines);
          }
        }}
        onDragEnd={() => {
          if (snapLinesKeyRef.current !== "") {
            snapLinesKeyRef.current = "";
            setSnapLines([]);
          }
        }}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale} listening={false}>
          {/* Page shadow */}
          <Rect
            x={6}
            y={8}
            width={pageW}
            height={pageH}
            fill="rgba(0,0,0,0.2)"
            shadowBlur={20}
            listening={false}
          />
        </Layer>

        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Group
            clipX={0}
            clipY={0}
            clipWidth={pageW}
            clipHeight={pageH}
          >
            <PageBackgroundNode background={page.background} width={pageW} height={pageH} />
            {page.layers.map((layer) => {
              if (!layer.visible) return null;
              if (layer.type === "image")
                return <ImageLayerNode key={layer.id} layer={layer} pageId={page.id} />;
              if (layer.type === "placeholder")
                return <PlaceholderLayerNode key={layer.id} layer={layer} pageId={page.id} />;
              if (layer.type === "text")
                return <TextLayerNode key={layer.id} layer={layer} pageId={page.id} />;
              if (layer.type === "decoration")
                return <DecorationLayerNode key={layer.id} layer={layer} pageId={page.id} />;
              return null;
            })}
          </Group>

          {/* Print Guides */}
          {showGuides && (
            <Group listening={false}>
              <Rect
                x={bleedPx}
                y={bleedPx}
                width={pageW - bleedPx * 2}
                height={pageH - bleedPx * 2}
                stroke="red"
                strokeWidth={1.5 / scale}
                dash={[5 / scale, 5 / scale]}
              />
              <Rect
                x={safePx}
                y={safePx}
                width={pageW - safePx * 2}
                height={pageH - safePx * 2}
                stroke="#3b82f6"
                strokeWidth={1.5 / scale}
                dash={[5 / scale, 5 / scale]}
              />
            </Group>
          )}

          {/* Page border */}
          <Rect
            x={0}
            y={0}
            width={pageW}
            height={pageH}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1 / scale}
            listening={false}
          />
          
<<<<<<< HEAD
          {/* Page Number */}
          <KonvaText
            x={0}
            y={pageH - 24}
            width={pageW}
            text={pageNumberString}
            fontSize={11}
            fontFamily="Inter"
            fill="rgba(0,0,0,0.35)"
            align="center"
            listening={false}
          />
          
          <KonvaTransformerRef trRef={trRef} />
=======
          <KonvaTransformerRef trRef={trRef} keepRatio={keepRatio} />
>>>>>>> 0b5d8b0b0be32523a447c9a5812eb6cc12ad2d3e

          {/* Snap Guides */}
          {snapLines.map((l, i) => (
            <Line
              key={i}
              points={
                l.type === "v"
                  ? [l.xLine!, 0, l.xLine!, l.length]
                  : [0, l.yLine!, l.length, l.yLine!]
              }
              stroke="#e81123" // Magenta-ish red for snap
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              listening={false}
            />
          ))}
        </Layer>
      </Stage>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md border bg-card/95 px-2 py-1 text-xs shadow-sm backdrop-blur">
        <button className="px-2 py-0.5 hover:bg-accent rounded" onClick={() => setFitMode("fit")}>
          Fit
        </button>
        <button
          className="px-2 py-0.5 hover:bg-accent rounded"
          onClick={() => setZoom(Math.max(0.05, scale - 0.1))}
        >
          −
        </button>
        <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button
          className="px-2 py-0.5 hover:bg-accent rounded"
          onClick={() => setZoom(scale + 0.1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function KonvaTransformerRef({
  trRef,
  keepRatio,
}: {
  trRef: React.RefObject<Konva.Transformer | null>;
  keepRatio: boolean;
}) {
  return (
    <KonvaTransformer
      ref={trRef as React.RefObject<Konva.Transformer>}
      rotateEnabled
      // Default proportional for photos/decorations; Shift toggles to free (handled by Konva: shiftBehavior).
      keepRatio={keepRatio}
      shiftBehavior={keepRatio ? "inverted" : "default"}
      enabledAnchors={
        keepRatio
          ? ["top-left", "top-right", "bottom-left", "bottom-right"]
          : undefined
      }
      borderStroke="#3b82f6"
      anchorStroke="#3b82f6"
      anchorFill="#fff"
      anchorSize={8}
      rotateAnchorOffset={24}
    />
  );
}
