// Preloaded premium vector assets for wedding/event albums.
// SVGs are encoded as SVG data URLs so they are fast, offline-ready, and render perfectly at 300 DPI.

export interface PreloadedAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  category: "floral" | "traditional" | "divider" | "badge";
}

export const PRELOADED_DECORATIONS: PreloadedAsset[] = [
  {
    id: "gold-corner-filigree",
    name: "Golden Floral Corner",
    category: "floral",
    width: 200,
    height: 200,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23d4af37" stroke-width="1.5">
        <path d="M5 5 C 20 5, 30 15, 30 30 C 30 45, 15 50, 5 50 Z" />
        <path d="M5 5 C 5 20, 15 30, 30 30 C 45 30, 50 15, 50 5 Z" />
        <circle cx="30" cy="30" r="3" fill="%23d4af37" />
        <path d="M5 5 L 80 5 C 60 15, 60 25, 55 35 C 50 45, 35 50, 5 80" />
        <path d="M8 8 Q 40 20 20 40 Q 50 50 80 8" />
        <path d="M5 5 Q 15 45 45 45" />
        <circle cx="55" cy="5" r="2" fill="%23d4af37" />
        <circle cx="5" cy="55" r="2" fill="%23d4af37" />
      </svg>`
    )}`,
  },
  {
    id: "royal-mandala",
    name: "Royal Golden Mandala",
    category: "traditional",
    width: 300,
    height: 300,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23d4af37" stroke-width="1">
        <circle cx="50" cy="50" r="45" stroke-dasharray="2,2" />
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="30" stroke-width="1.5" />
        <circle cx="50" cy="50" r="10" fill="%23d4af37" opacity="0.2" />
        <path d="M50 5 L50 95 M5 50 L95 50" />
        <path d="M18.2 18.2 L81.8 81.8 M18.2 81.8 L81.8 18.2" />
        <!-- Symmetrical petals -->
        ${Array.from({ length: 12 })
          .map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + Math.cos(angle) * 10;
            const y1 = 50 + Math.sin(angle) * 10;
            const x2 = 50 + Math.cos(angle) * 30;
            const y2 = 50 + Math.sin(angle) * 30;
            const cx1 = 50 + Math.cos(angle + 0.2) * 22;
            const cy1 = 50 + Math.sin(angle + 0.2) * 22;
            const cx2 = 50 + Math.cos(angle - 0.2) * 22;
            const cy2 = 50 + Math.sin(angle - 0.2) * 22;
            return `<path d="M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2} Q ${cx2} ${cy2} ${x1} ${y1}" fill="%23d4af37" opacity="0.6"/>`;
          })
          .join("")}
      </svg>`
    )}`,
  },
  {
    id: "elegant-divider-heart",
    name: "Heart Filigree Divider",
    category: "divider",
    width: 400,
    height: 100,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" fill="none" stroke="%23d4af37" stroke-width="1.5">
        <path d="M10 25 L 85 25 Q 92 15 100 25 Q 108 15 115 25 L 190 25" />
        <path d="M70 25 Q 85 38 100 25 Q 115 38 130 25" />
        <path d="M90 25 C 92 20, 95 18, 100 25 C 105 18, 108 20, 110 25 C 108 30, 105 32, 100 38 C 95 32, 92 30, 90 25 Z" fill="%23d4af37" />
        <circle cx="45" cy="25" r="2" fill="%23d4af37" />
        <circle cx="155" cy="25" r="2" fill="%23d4af37" />
      </svg>`
    )}`,
  },
  {
    id: "rose-wreath-circular",
    name: "Floral Watercolor Wreath",
    category: "floral",
    width: 250,
    height: 250,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="%23ec4899" stroke-width="1" stroke-dasharray="4,2" opacity="0.3"/>
        <circle cx="50" cy="50" r="38" stroke="%2310b981" stroke-width="0.75" opacity="0.4"/>
        <!-- Leaves -->
        <path d="M30 18 Q 33 13 40 15 Q 35 22 30 18 Z" fill="%2310b981" opacity="0.7"/>
        <path d="M70 18 Q 67 13 60 15 Q 65 22 70 18 Z" fill="%2310b981" opacity="0.7"/>
        <path d="M15 45 Q 12 38 18 35 Q 22 42 15 45 Z" fill="%2310b981" opacity="0.7"/>
        <path d="M85 45 Q 88 38 82 35 Q 78 42 85 45 Z" fill="%2310b981" opacity="0.7"/>
        <!-- Roses -->
        <circle cx="50" cy="10" r="4" fill="%23f43f5e" />
        <circle cx="50" cy="10" r="2.5" fill="%23fda4af" />
        <circle cx="15" cy="50" r="4" fill="%23f43f5e" />
        <circle cx="15" cy="50" r="2.5" fill="%23fda4af" />
        <circle cx="85" cy="50" r="4" fill="%23f43f5e" />
        <circle cx="85" cy="50" r="2.5" fill="%23fda4af" />
        <circle cx="50" cy="90" r="5" fill="%23ec4899" />
        <circle cx="50" cy="90" r="3.5" fill="%23fbcfe8" />
        <path d="M47 88 Q 50 82 53 88" stroke="%23ec4899" stroke-width="1"/>
      </svg>`
    )}`,
  },
  {
    id: "mandap-indian-wedding",
    name: "Mandap Sketch Clipart",
    category: "traditional",
    width: 300,
    height: 250,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none" stroke="%23d4af37" stroke-width="1.2">
        <!-- Pillars -->
        <rect x="25" y="40" width="8" height="50" rx="1" />
        <rect x="87" y="40" width="8" height="50" rx="1" />
        <line x1="29" y1="40" x2="29" y2="90" />
        <line x1="91" y1="40" x2="91" y2="90" />
        <!-- Top Arch -->
        <path d="M15 40 C 35 20, 85 20, 105 40 Z" fill="%23d4af37" opacity="0.1" />
        <path d="M15 40 Q 60 15 105 40" stroke-width="1.8" />
        <path d="M20 42 Q 60 22 100 42" />
        <path d="M25 45 Q 60 28 95 45" />
        <!-- Hanging garlands / Kalash decoration -->
        <circle cx="60" cy="27" r="3" fill="%23d4af37" />
        <path d="M60 27 L 60 38" />
        <circle cx="60" cy="38" r="1.5" fill="%23ec4899" />
        <path d="M45 35 Q 45 45 48 45" />
        <path d="M75 35 Q 75 45 72 45" />
        <circle cx="48" cy="45" r="1" fill="%23d4af37" />
        <circle cx="72" cy="45" r="1" fill="%23d4af37" />
      </svg>`
    )}`,
  },
  {
    id: "magic-sparkle-stars",
    name: "Golden Sparkle Stars",
    category: "badge",
    width: 200,
    height: 200,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23d4af37">
        <!-- Big Sparkle -->
        <path d="M50 15 Q 50 50 15 50 Q 50 50 50 85 Q 50 50 85 50 Q 50 50 50 15 Z" />
        <!-- Small Sparkle 1 -->
        <path d="M22 18 Q 22 30 10 30 Q 22 30 22 42 Q 22 30 34 30 Q 22 30 22 18 Z" opacity="0.7" />
        <!-- Small Sparkle 2 -->
        <path d="M78 68 Q 78 78 68 78 Q 78 78 78 88 Q 78 78 88 78 Q 78 78 78 68 Z" opacity="0.8" />
        <!-- Dots -->
        <circle cx="25" cy="70" r="2.5" />
        <circle cx="72" cy="28" r="1.5" />
        <circle cx="48" cy="5" r="1" />
      </svg>`
    )}`,
  },
  {
    id: "classic-badge-frame",
    name: "Classic Golden Badge Border",
    category: "badge",
    width: 250,
    height: 250,
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23d4af37" stroke-width="1.2">
        <rect x="10" y="10" width="80" height="80" rx="8" />
        <rect x="14" y="14" width="72" height="72" rx="5" stroke-dasharray="1.5,1.5" />
        <path d="M5 25 L 15 25 M85 25 L 95 25 M5 75 L 15 75 M85 75 L 95 75" />
        <path d="M25 5 L 25 15 M25 85 L 25 95 M75 5 L 75 15 M75 85 L 75 95" />
        <circle cx="50" cy="14" r="2.5" fill="%23d4af37" />
        <circle cx="50" cy="86" r="2.5" fill="%23d4af37" />
        <circle cx="14" cy="50" r="2.5" fill="%23d4af37" />
        <circle cx="86" cy="50" r="2.5" fill="%23d4af37" />
      </svg>`
    )}`,
  }
];
