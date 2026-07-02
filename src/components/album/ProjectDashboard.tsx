import { useAlbumStore } from "@/lib/album-store";
import type { AlbumSizePreset } from "@/types/album";
import { ALBUM_PRESETS } from "@/types/album";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Plus, Trash2, Copy, Edit3, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function ProjectDashboard() {
  const projects = useAlbumStore((s) => s.projectsList);
  const currentId = useAlbumStore((s) => s.currentProjectId);
  const selectProject = useAlbumStore((s) => s.selectProject);
  const createProject = useAlbumStore((s) => s.createProject);
  const duplicateProject = useAlbumStore((s) => s.duplicateProject);
  const deleteProject = useAlbumStore((s) => s.deleteProject);

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("My New Photobook");
  const [newProjPreset, setNewProjPreset] = useState<AlbumSizePreset>("12x36");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  const handleCreate = async () => {
    if (!newProjName.trim()) return;
    const id = await createProject(newProjName, newProjPreset);
    setCreateOpen(false);
    setOpen(false);
    toast({ title: "Project Created", description: `"${newProjName}" is now active.` });
  };

  const handleRename = (id: string, name: string) => {
    setRenameId(id);
    setRenameName(name);
    setRenameOpen(true);
  };

  const handleSaveRename = () => {
    if (!renameName.trim()) return;
    const s = useAlbumStore.getState();
    if (s.currentProjectId === renameId) {
      s.renameAlbum(renameName);
    } else {
      // If it's not active, modify in the list directly
      const newList = s.projectsList.map((p) =>
        p.id === renameId ? { ...p, name: renameName, updatedAt: Date.now() } : p
      );
      useAlbumStore.setState({ projectsList: newList });
    }
    setRenameOpen(false);
    toast({ title: "Project Renamed", description: `Renamed to "${renameName}".` });
  };

  const handleSelect = async (id: string) => {
    await selectProject(id);
    setOpen(false);
    const selected = projects.find((p) => p.id === id);
    toast({ title: "Project Switched", description: `"${selected?.name}" is now active.` });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-md">
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <span>My Projects ({projects.length})</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Project Dashboard
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Manage and switch between your design photobooks.
              </p>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Project
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                <FolderOpen className="h-12 w-12 text-slate-300 animate-bounce" />
                <p className="text-sm font-semibold text-slate-500">No projects found</p>
                <Button size="sm" onClick={() => setCreateOpen(true)}>Create your first project</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projects.map((p) => {
                  const isActive = p.id === currentId;
                  const sizeLabel = ALBUM_PRESETS[p.preset as Exclude<AlbumSizePreset, "custom">]?.label || "Custom Size";
                  return (
                    <div
                      key={p.id}
                      className={`group relative rounded-xl border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md ${
                        isActive
                          ? "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10 ring-1 ring-blue-500"
                          : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300"
                      }`}
                    >
                      {/* Project Header card / visual representation */}
                      <div
                        className="aspect-[3/1] w-full bg-slate-100 dark:bg-slate-800/80 relative flex items-center justify-center cursor-pointer p-4"
                        onClick={() => handleSelect(p.id)}
                      >
                        {isActive && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm z-10">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        <div className="text-center">
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block truncate max-w-[180px]">
                            {p.name}
                          </span>
                          <span className="text-[9px] uppercase tracking-wide text-slate-400 mt-1 block">
                            {sizeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Card actions / footer */}
                      <div className="p-3 bg-white/80 dark:bg-slate-950/80 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground">
                          Last edited: {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRename(p.id, p.name)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-blue-500"
                            title="Rename Project"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              duplicateProject(p.id);
                              toast({ title: "Project Duplicated", description: `Copied "${p.name}".` });
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-indigo-500"
                            title="Duplicate Project"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete project "${p.name}"? This action cannot be undone.`)) {
                                deleteProject(p.id);
                                toast({ title: "Project Deleted", description: `Removed "${p.name}".` });
                              }
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-red-500"
                            title="Delete Project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Create New Album Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project Name</Label>
              <Input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Page Spread Preset Size</Label>
              <Select value={newProjPreset} onValueChange={(v) => setNewProjPreset(v as AlbumSizePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALBUM_PRESETS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!newProjName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RENAME DIALOG */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs">Project Name</Label>
            <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveRename} disabled={!renameName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
