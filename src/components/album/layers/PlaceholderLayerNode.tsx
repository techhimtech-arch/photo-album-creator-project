import { useRef } from "react";
import { Group, Rect, Text } from "react-konva";
import Konva from "konva";
import { useAlbumStore } from "@/lib/album-store";
import type { PlaceholderLayer } from "@/types/album";

interface Props {
  layer: PlaceholderLayer;
  pageId: string;
}

export default function PlaceholderLayerNode({ layer, pageId }: Props) {
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);
  const selected = useAlbumStore((s) => s.selectedLayerIds);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const ref = useRef<Konva.Group>(null);

  const commit = () => setAlbum((a) => ({ ...a }), true);
  const isSelected = selected.includes(layer.id);
  const cornerR =
    layer.mask === "rounded" ? Math.min(layer.cornerRadius, layer.width / 2, layer.height / 2) : 0;

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      width={layer.width}
      height={layer.height}
      opacity={layer.opacity}
      draggable={!layer.locked}
      ref={ref}
      onClick={(e) => {
        e.cancelBubble = true;
        const current = useAlbumStore.getState().selectedLayerIds;
        if (e.evt.shiftKey) {
          const next = current.includes(layer.id)
            ? current.filter((id) => id !== layer.id)
            : [...current, layer.id];
          setSelected(next);
        } else {
          setSelected([layer.id]);
        }
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        const current = useAlbumStore.getState().selectedLayerIds;
        const next = current.includes(layer.id)
          ? current.filter((id) => id !== layer.id)
          : [...current, layer.id];
        setSelected(next);
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
        const newW = Math.max(8, layer.width * Math.abs(sx));
        const newH = Math.max(8, layer.height * Math.abs(sy));
        node.scaleX(1);
        node.scaleY(1);
        updateLayer(pageId, layer.id, {
          x: node.x(),
          y: node.y(),
          width: newW,
          height: newH,
          rotation: node.rotation(),
        });
        commit();
      }}
    >
      <Rect
        x={0}
        y={0}
        width={layer.width}
        height={layer.height}
        fill={isSelected ? "#dbeafe" : "#f3f4f6"}
        stroke={isSelected ? "#3b82f6" : "#9ca3af"}
        strokeWidth={isSelected ? 2 : 1.5}
        dash={[8, 6]}
        cornerRadius={cornerR}
      />
      <Text
        x={0}
        y={layer.height / 2 - 10}
        width={layer.width}
        text={layer.name || "Photo"}
        fontSize={Math.min(16, layer.width / 6)}
        fill="#6b7280"
        align="center"
        listening={false}
      />
      {layer.border && layer.border.width > 0 && (
        <Rect
          x={0}
          y={0}
          width={layer.width}
          height={layer.height}
          stroke={layer.border.color}
          strokeWidth={layer.border.width}
          cornerRadius={cornerR}
          listening={false}
        />
      )}
    </Group>
  );
}
