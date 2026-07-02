import { useAlbumStore } from "@/lib/album-store";
import type { AlbumTheme } from "@/types/album";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const THEMES: AlbumTheme[] = [
  {
    id: "classic",
    name: "Classic Elegance",
    description: "Traditional book layout with white margins, serif typography, and sharp photo frames.",
    gap: 16,
    cornerRadius: 0,
    borderWidth: 4,
    borderColor: "#ffffff",
    fonts: ["Playfair Display", "Lora"],
    backgrounds: [{ kind: "color", color: "#ffffff" }],
  },
  {
    id: "luxury",
    name: "Dark Luxury",
    description: "Gold-bordered photos, wide spacing, dark backdrops, and classical high-end feel.",
    gap: 24,
    cornerRadius: 4,
    borderWidth: 2,
    borderColor: "#d4af37", // Gold
    fonts: ["Cinzel", "Lora"],
    backgrounds: [{ kind: "color", color: "#111827" }],
  },
  {
    id: "minimal",
    name: "Minimalist Modern",
    description: "Clean gap spacing, borderless layout, and pure neutral light background colors.",
    gap: 8,
    cornerRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    fonts: ["Montserrat", "Inter"],
    backgrounds: [{ kind: "color", color: "#f8fafc" }],
  },
  {
    id: "modern",
    name: "Soft Modern",
    description: "Generous rounded borders, wide spacing, and beautiful pastel gradients.",
    gap: 20,
    cornerRadius: 16,
    borderWidth: 0,
    borderColor: "transparent",
    fonts: ["Lora", "Inter"],
    backgrounds: [
      {
        kind: "gradient",
        gradient: "linear",
        from: "#faf5ff",
        to: "#fdf2f8",
        angle: 135,
      },
    ],
  },
  {
    id: "royal",
    name: "Royal Heritage",
    description: "Vibrant sapphire coloring with gold borders and elegant script headers.",
    gap: 22,
    cornerRadius: 8,
    borderWidth: 4,
    borderColor: "#d4af37",
    fonts: ["Cinzel", "Great Vibes"],
    backgrounds: [{ kind: "color", color: "#1e1b4b" }], // Dark Indigo
  },
  {
    id: "traditional",
    name: "Rustic Traditional",
    description: "Warm parchment hues, rounded corners, and soft floral decorations style.",
    gap: 18,
    cornerRadius: 12,
    borderWidth: 4,
    borderColor: "#ffffff",
    fonts: ["Dancing Script", "Playfair Display"],
    backgrounds: [{ kind: "color", color: "#fafaf9" }],
  },
  {
    id: "dark",
    name: "Sleek Dark Mode",
    description: "Clean, dark charcoal styling suited for high-contrast professional collections.",
    gap: 16,
    cornerRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
    fonts: ["Montserrat", "Inter"],
    backgrounds: [{ kind: "color", color: "#0f172a" }],
  },
  {
    id: "light",
    name: "Airy Light Mode",
    description: "Minimalist white canvas layout, thin soft boundaries, and light typography.",
    gap: 16,
    cornerRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fonts: ["Inter", "Lora"],
    backgrounds: [{ kind: "color", color: "#f8fafc" }],
  },
];

export default function ThemePanel() {
  const applyTheme = useAlbumStore((s) => s.applyTheme);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  const handleApply = (theme: AlbumTheme) => {
    applyTheme(theme);
    setActiveThemeId(theme.id);
    toast({
      title: `${theme.name} theme applied`,
      description: "Updated spacing, border styles, corners, backgrounds and default fonts.",
    });
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
          Album Design Themes
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Apply a design system style guide to automatically format your layouts.
        </p>
      </div>

      <div className="space-y-3">
        {THEMES.map((theme) => {
          const isActive = activeThemeId === theme.id;
          return (
            <div
              key={theme.id}
              className={`group rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm ${
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300"
              }`}
              onClick={() => handleApply(theme)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  {theme.name}
                </span>
                {isActive && (
                  <span className="bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                {theme.description}
              </p>
              
              <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-500 font-medium">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Gap: {theme.gap}px</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Radius: {theme.cornerRadius}px</span>
                </div>
                {theme.borderWidth > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Border: {theme.borderWidth}px</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-2 text-[10px] text-center text-muted-foreground">
        Note: Applying a theme will format all existing placeholders, images, and backgrounds across pages.
      </div>
    </div>
  );
}
