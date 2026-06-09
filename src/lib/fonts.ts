import WebFont from "webfontloader";

const loaded = new Set<string>();
const SYSTEM = new Set(["Georgia", "Inter", "Arial", "Helvetica", "Times New Roman"]);

export function loadFont(family: string) {
  if (loaded.has(family) || SYSTEM.has(family)) return Promise.resolve();
  loaded.add(family);
  return new Promise<void>((resolve) => {
    WebFont.load({
      google: { families: [`${family}:400,700`] },
      active: () => resolve(),
      inactive: () => resolve(),
    });
  });
}

// Preload common wedding fonts on first import
export function preloadWeddingFonts() {
  WebFont.load({
    google: {
      families: [
        "Playfair Display:400,700",
        "Cormorant Garamond:400,700",
        "Great Vibes",
        "Dancing Script:400,700",
        "Cinzel:400,700",
        "Montserrat:400,700",
        "Lora:400,700",
        "Italianno",
        "Parisienne",
        "Tangerine:400,700",
      ],
    },
  });
}
