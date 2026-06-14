import Konva from "konva";

export interface SnapLine {
  guide: number;
  offset: number;
  snap: "start" | "center" | "end";
  type: "h" | "v";
}

export function getSnapLines(
  node: Konva.Node,
  pageW: number,
  pageH: number,
  layers: any[],
  tolerance: number
): { xLine?: number; yLine?: number; type: "h" | "v"; length: number }[] {
  const box = node.getClientRect({ skipTransform: false });
  // Konva clientRect includes scale, so we need to divide by node's absolute scale if it's inside a scaled layer.
  // Actually, node.x() and node.y() are relative to the parent layer.
  // The parent layer is scaled by `scale`. 
  // It's easier to work in the parent's coordinate space (unscaled page coordinates).
  const absPos = node.position();
  
  // We will snap based on the node's relative x, y, width, height in the page coordinate space.
  const w = node.width() * Math.abs(node.scaleX());
  const h = node.height() * Math.abs(node.scaleY());
  const x = absPos.x;
  const y = absPos.y;

  const nodeEdges = {
    v: [x, x + w / 2, x + w],
    h: [y, y + h / 2, y + h],
  };

  const targetEdges = {
    v: [0, pageW / 2, pageW],
    h: [0, pageH / 2, pageH],
  };

  // Add edges of other layers
  const parent = node.parent;
  if (parent) {
    parent.children?.forEach((child) => {
      if (child === node || child.name() === "page-bg" || child.className === "Transformer" || child.name() === "_anchor") return;
      if (!child.visible()) return;

      const cw = child.width() * Math.abs(child.scaleX());
      const ch = child.height() * Math.abs(child.scaleY());
      const cx = child.x();
      const cy = child.y();

      targetEdges.v.push(cx, cx + cw / 2, cx + cw);
      targetEdges.h.push(cy, cy + ch / 2, cy + ch);
    });
  }

  const result: { xLine?: number; yLine?: number; type: "h" | "v"; length: number }[] = [];
  let snappedX = false;
  let snappedY = false;

  for (const nodeV of nodeEdges.v) {
    if (snappedX) break;
    for (const targetV of targetEdges.v) {
      if (Math.abs(nodeV - targetV) < tolerance) {
        // snap!
        const diff = targetV - nodeV;
        node.x(x + diff);
        snappedX = true;
        result.push({ xLine: targetV, type: "v", length: pageH });
        break;
      }
    }
  }

  for (const nodeH of nodeEdges.h) {
    if (snappedY) break;
    for (const targetH of targetEdges.h) {
      if (Math.abs(nodeH - targetH) < tolerance) {
        // snap!
        const diff = targetH - nodeH;
        node.y(y + diff);
        snappedY = true;
        result.push({ yLine: targetH, type: "h", length: pageW });
        break;
      }
    }
  }

  return result;
}
