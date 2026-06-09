import { useRef } from "react";
import { Text, TextPath, Group } from "react-konva";
import Konva from "konva";
import { useAlbumStore } from "@/lib/album-store";
import type { TextLayer } from "@/types/album";

interface Props {
  layer: TextLayer;
  pageId: string;
}

export default function TextLayerNode({ layer, pageId }: Props) {
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const ref = useRef<Konva.Group>(null);
  const commit = () => setAlbum((a) => ({ ...a }), true);

  const curveData = (() => {
    if (!layer.curve) return null;
    const w = layer.width;
    const h = layer.height;
    const curveAmt = (layer.curve / 100) * h * 0.5;
    // quadratic Bezier from (0, h/2) to (w, h/2) curving by curveAmt
    return `M 0 ${h / 2} Q ${w / 2} ${h / 2 - curveAmt} ${w} ${h / 2}`;
  })();

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
          width: Math.max(20, layer.width * Math.abs(sx)),
          height: Math.max(20, layer.height * Math.abs(sy)),
          fontSize: Math.max(8, layer.fontSize * Math.abs(sy)),
          rotation: node.rotation(),
        });
        commit();
      }}
    >
      {curveData ? (
        <TextPath
          data={curveData}
          text={layer.text}
          fontFamily={layer.fontFamily}
          fontSize={layer.fontSize}
          fontStyle={`${layer.fontStyle === "italic" ? "italic " : ""}${layer.fontWeight}`}
          fill={layer.fill}
          stroke={layer.stroke?.color}
          strokeWidth={layer.stroke?.width}
          align={layer.align}
        />
      ) : (
        <Text
          text={layer.text}
          width={layer.width}
          fontFamily={layer.fontFamily}
          fontSize={layer.fontSize}
          fontStyle={`${layer.fontStyle === "italic" ? "italic " : ""}${layer.fontWeight}`}
          fill={layer.fill}
          stroke={layer.stroke?.color}
          strokeWidth={layer.stroke?.width ?? 0}
          align={layer.align}
          letterSpacing={layer.letterSpacing}
          lineHeight={layer.lineHeight}
          shadowBlur={layer.shadow?.blur ?? 0}
          shadowOffsetX={layer.shadow?.offsetX ?? 0}
          shadowOffsetY={layer.shadow?.offsetY ?? 0}
          shadowColor={layer.shadow?.color ?? "#000"}
          shadowOpacity={layer.shadow?.opacity ?? 0}
        />
      )}
    </Group>
  );
}
