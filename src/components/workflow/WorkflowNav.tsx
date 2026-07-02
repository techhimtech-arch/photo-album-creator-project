import { useAlbumStore } from "@/lib/album-store";
import type { WorkflowMode } from "@/lib/album-persistence";
import { FileCode2, Palette, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectDashboard from "@/components/album/ProjectDashboard";

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
    <div className="glass-panel z-50 sticky top-0 border-b border-white/20 px-4 py-3 shadow-md transition-all">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <ProjectDashboard />
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden lg:flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Workflow: design once → reuse for every client album
          </div>
        </div>
        
        <div className="flex items-center justify-center p-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md shadow-inner border border-white/10 dark:border-black/20 w-full md:w-auto">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-center transition-all duration-300 sm:flex-row sm:gap-2 flex-1 md:flex-none outline-none",
                  active
                    ? "text-blue-700 dark:text-blue-300 font-semibold transform scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40",
                )}
              >
                {active && (
                  <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-white/50 dark:border-white/10 -z-10" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-600 dark:text-blue-400" : "")} />
                <div className="min-w-0 text-left">
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {m.short}
                  </div>
                  <div className="text-sm truncate leading-tight">{m.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
