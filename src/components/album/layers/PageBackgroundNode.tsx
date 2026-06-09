import { useMemo } from "react";
import { Rect, Image as KonvaImage, Group } from "react-konva";
import useImage from "@/hooks/use-konva-image";
import type { PageBackground } from "@/types/album";

interface Props {
  background: PageBackground;
  width: number;
  height: number;
}

export default function PageBackgroundNode({ background, width, height }: Props) {
  if (background.kind === "color") {
    return <Rect name="page-bg" x={0} y={0} width={width} height={height} fill={background.color} />;
  }
  if (background.kind === "gradient") {
    const { gradient, from, to, angle } = background;
    if (gradient === "linear") {
      const rad = (angle * Math.PI) / 180;
      const x1 = 0, y1 = 0, x2 = Math.cos(rad) * width, y2 = Math.sin(rad) * height;
      return (
        <Rect
          name="page-bg"
          x={0}
          y={0}
          width={width}
          height={height}
          fillLinearGradientStartPoint={{ x: x1, y: y1 }}
          fillLinearGradientEndPoint={{ x: x2, y: y2 }}
          fillLinearGradientColorStops={[0, from, 1, to]}
        />
      );
    }
    return (
      <Rect
        name="page-bg"
        x={0}
        y={0}
        width={width}
        height={height}
        fillRadialGradientStartPoint={{ x: width / 2, y: height / 2 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: width / 2, y: height / 2 }}
        fillRadialGradientEndRadius={Math.max(width, height) / 1.5}
        fillRadialGradientColorStops={[0, from, 1, to]}
      />
    );
  }
  return <BgImage background={background} width={width} height={height} />;
}

function BgImage({
  background,
  width,
  height,
}: {
  background: Extract<PageBackground, { kind: "image" }>;
  width: number;
  height: number;
}) {
  const [img] = useImage(background.src);
  const props = useMemo(() => {
    if (!img) return null;
    if (background.fit === "cover") {
      const s = Math.max(width / img.width, height / img.height);
      const w = img.width * s;
      const h = img.height * s;
      return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
    }
    if (background.fit === "contain") {
      const s = Math.min(width / img.width, height / img.height);
      const w = img.width * s;
      const h = img.height * s;
      return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
    }
    return { x: 0, y: 0, width, height };
  }, [img, background.fit, width, height]);

  return (
    <Group name="page-bg" opacity={background.opacity}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {img && props && (
        <KonvaImage
          image={img}
          {...props}
          listening={false}
          {...(background.fit === "tile" && img
            ? {
                fillPatternImage: img,
                fillPatternRepeat: "repeat",
                fill: undefined,
              }
            : {})}
        />
      )}
    </Group>
  );
}
