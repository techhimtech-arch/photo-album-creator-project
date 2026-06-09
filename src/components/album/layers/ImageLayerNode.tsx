import { useRef, useEffect } from "react";
import { Image as KonvaImage, Group, Rect } from "react-konva";
import Konva from "konva";
import useImage from "@/hooks/use-konva-image";
import { useAlbumStore } from "@/lib/album-store";
import type { ImageLayer } from "@/types/album";

interface Props {
  layer: ImageLayer;
  pageId: string;
}

export default function ImageLayerNode({ layer, pageId }: Props) {
  const [img] = useImage(layer.src);
  const updateLayer = useAlbumStore((s) => s.updateLayer);
  const setAlbum = useAlbumStore((s) => s.setAlbum);
  const selected = useAlbumStore((s) => s.selectedLayerIds);
  const setSelected = useAlbumStore((s) => s.setSelected);
  const ref = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const isSelected = selected.includes(layer.id);

  // Commit history on transform end
  const commit = () => {
    setAlbum((a) => ({ ...a }), true);
  };

  const clipFunc = (() => {
    const w = layer.width;
    const h = layer.height;
    if (layer.mask === "rounded") {
      const r = Math.min(layer.cornerRadius, w / 2, h / 2);
      return (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
      };
    }
    if (layer.mask === "circle") {
      return (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.closePath();
      };
    }
    if (layer.mask === "heart") {
      return (ctx: CanvasRenderingContext2D) => {
        const cx = w / 2;
        const topY = h * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.bezierCurveTo(cx - w * 0.55, topY - h * 0.35, cx - w * 0.55, topY + h * 0.45, cx, h);
        ctx.bezierCurveTo(cx + w * 0.55, topY + h * 0.45, cx + w * 0.55, topY - h * 0.35, cx, topY);
        ctx.closePath();
      };
    }
    if (layer.mask === "triangle") {
      return (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
      };
    }
    if (layer.mask === "hexagon") {
      return (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h * 0.25);
        ctx.lineTo(w, h * 0.75);
        ctx.lineTo(w / 2, h);
        ctx.lineTo(0, h * 0.75);
        ctx.lineTo(0, h * 0.25);
        ctx.closePath();
      };
    }
    if (layer.mask === "star") {
      return (ctx: CanvasRenderingContext2D) => {
        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = Math.min(w, h) / 2;
        const innerRadius = outerRadius / 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            cx + Math.cos((18 + i * 72) / 180 * Math.PI) * outerRadius,
            cy - Math.sin((18 + i * 72) / 180 * Math.PI) * outerRadius
          );
          ctx.lineTo(
            cx + Math.cos((54 + i * 72) / 180 * Math.PI) * innerRadius,
            cy - Math.sin((54 + i * 72) / 180 * Math.PI) * innerRadius
          );
        }
        ctx.closePath();
      };
    }
    return undefined;
  })();

  const hasFilters = layer.filters && Object.keys(layer.filters).length > 0;
  
  useEffect(() => {
    if (img && hasFilters) {
      imageRef.current?.cache();
    } else if (img && !hasFilters) {
      imageRef.current?.clearCache();
    }
  }, [img, hasFilters, layer.filters, layer.width, layer.height, layer.crop, layer.flipH, layer.flipV]);

  if (!img) {
    return (
      <Rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill="#e5e7eb"
        opacity={0.5}
        listening={false}
      />
    );
  }

  const flipScaleX = layer.flipH ? -1 : 1;
  const flipScaleY = layer.flipV ? -1 : 1;

  const crop = layer.crop
    ? {
        cropX: layer.crop.x * img.width,
        cropY: layer.crop.y * img.height,
        cropWidth: layer.crop.w * img.width,
        cropHeight: layer.crop.h * img.height,
      }
    : {};

  const activeFilters = [];
  if (layer.filters?.brightness !== undefined) activeFilters.push(Konva.Filters.Brighten);
  if (layer.filters?.contrast !== undefined) activeFilters.push(Konva.Filters.Contrast);
  if (layer.filters?.blur !== undefined) activeFilters.push(Konva.Filters.Blur);
  if (layer.filters?.grayscale) activeFilters.push(Konva.Filters.Grayscale);
  if (layer.filters?.sepia) activeFilters.push(Konva.Filters.Sepia);

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
      <Group clipFunc={clipFunc as never}>
        <Group
          x={layer.flipH ? layer.width : 0}
          y={layer.flipV ? layer.height : 0}
          scaleX={flipScaleX}
          scaleY={flipScaleY}
        >
          <KonvaImage
            ref={imageRef}
            image={img}
            width={layer.width}
            height={layer.height}
            {...crop}
            filters={activeFilters.length > 0 ? activeFilters : undefined}
            brightness={layer.filters?.brightness ?? 0}
            contrast={layer.filters?.contrast ?? 0}
            blurRadius={layer.filters?.blur ?? 0}
            shadowBlur={layer.shadow?.blur ?? 0}
            shadowOffsetX={layer.shadow?.offsetX ?? 0}
            shadowOffsetY={layer.shadow?.offsetY ?? 0}
            shadowColor={layer.shadow?.color ?? "#000"}
            shadowOpacity={layer.shadow?.opacity ?? 0}
          />
        </Group>
      </Group>
      {layer.border && layer.border.width > 0 && (
        <Rect
          x={0}
          y={0}
          width={layer.width}
          height={layer.height}
          stroke={layer.border.color}
          strokeWidth={layer.border.width}
          cornerRadius={layer.mask === "rounded" ? layer.cornerRadius : 0}
          listening={false}
        />
      )}
    </Group>
  );
}
