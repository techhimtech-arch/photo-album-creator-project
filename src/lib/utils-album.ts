export const uid = () => Math.random().toString(36).slice(2, 10);

export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export async function createThumbnail(file: Blob | File, maxDim = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2d context"));
        return;
      }
      
      const ratio = img.naturalWidth / img.naturalHeight;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      
      if (w > h) {
        if (w > maxDim) {
          w = maxDim;
          h = maxDim / ratio;
        }
      } else {
        if (h > maxDim) {
          h = maxDim;
          w = maxDim * ratio;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    
    img.src = objectUrl;
  });
}
