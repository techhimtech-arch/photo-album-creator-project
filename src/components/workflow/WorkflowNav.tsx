import { useAlbumStore } from "@/lib/album-store";
import type { WorkflowMode } from "@/lib/album-persistence";
import { FileCode2, Palette, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES: {
  id: WorkflowMode;
  label: string;
  short: string;
  desc: string;
  icon: typeof FileCode2;
}[] = [
  {
    id: "converter",
    label: "PSD Converter",
    short: "Step 1",
    desc: "PSD → JSON template",
    icon: FileCode2,
  },
  {
    id: "designer",
    label: "Album Designer",
    short: "Step 2",
    desc: "Templates & page design",
    icon: Palette,
  },
  {
    id: "producer",
    label: "Quick Produce",
    short: "Step 3",
    desc: "Photos → print",
    icon: Zap,
  },
];

export default function WorkflowNav() {
  const mode = useAlbumStore((s) => s.workflowMode);
  const setMode = useAlbumStore((s) => s.setWorkflowMode);

  return (
    <div className="border-b bg-card px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground hidden md:block">
          Workflow: design once → reuse for every client album
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-center transition-colors sm:flex-row sm:gap-2 sm:px-3",
                  active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {m.short}
                  </div>
                  <div className="text-xs font-semibold truncate">{m.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground text-center sm:text-left">
        {MODES.find((m) => m.id === mode)?.desc}
      </p>
    </div>
  );
}
