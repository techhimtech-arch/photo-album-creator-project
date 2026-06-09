import { useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "@/hooks/use-konva-image";
import { useAlbumStore } from "@/lib/album-store";
import type { DecorationLayer } from "@/types/album";

export default function DecorationLayerNode({
  layer,
  pageId,
}: {
  layer: DecorationLayer;
  pageId: string;
}) {
  const [img] = useImage(layer.src);
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const ref = useRef<Konva.Image>(null);
  const commit = () => setAlbum((a) => ({ ...a }), true);

  if (!img) return null;

  return (
    <KonvaImage
      id={layer.id}
      image={img}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      ref={ref}
      globalCompositeOperation={layer.blendMode}
      onClick={(e) => {
        e.cancelBubble = true;
        setSelected([layer.id]);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelected([layer.id]);
      }}
      onDragEnd={(e) => {
        updateLayer(pageId, layer.id, { x: e.target.x(), y: e.target.y() });
        commit();
      }}
      onTransformEnd={() => {
        const node = ref.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        updateLayer(pageId, layer.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(8, layer.width * Math.abs(sx)),
          height: Math.max(8, layer.height * Math.abs(sy)),
          rotation: node.rotation(),
        });
        commit();
      }}
    />
  );
}
