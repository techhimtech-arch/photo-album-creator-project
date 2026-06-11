import Toolbar from "@/components/album/Toolbar";
import PageSidebar from "@/components/album/PageSidebar";
import EditorCanvas from "@/components/album/EditorCanvas";
import DesignerRightPanel from "@/components/workflow/DesignerRightPanel";

export default function DesignerView() {
  return (
    <>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <PageSidebar />
        <EditorCanvas />
        <DesignerRightPanel />
      </div>
    </>
  );
}
