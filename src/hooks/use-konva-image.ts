import { useEffect, useState } from "react";

// Lightweight hook replicating use-image, returns [HTMLImageElement | undefined]
export default function useImage(src: string | undefined): [HTMLImageElement | undefined, "loaded" | "loading" | "failed"] {
  const [img, setImg] = useState<HTMLImageElement | undefined>();
  const [status, setStatus] = useState<"loaded" | "loading" | "failed">("loading");

  useEffect(() => {
    if (!src) {
      setImg(undefined);
      setStatus("loading");
      return;
    }
    const el = new Image();
    el.crossOrigin = "anonymous";
    let cancelled = false;
    el.onload = () => {
      if (cancelled) return;
      setImg(el);
      setStatus("loaded");
    };
    el.onerror = () => {
      if (cancelled) return;
      setImg(undefined);
      setStatus("failed");
    };
    el.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return [img, status];
}
