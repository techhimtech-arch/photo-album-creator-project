import { useEffect, useState } from "react";
import { useIdStore } from "@/lib/idcard-store";
import Stepper from "@/components/idcard/Stepper";
import StepUpload from "@/components/idcard/StepUpload";
import StepMapping from "@/components/idcard/StepMapping";
import StepReview from "@/components/idcard/StepReview";
import StepDesign from "@/components/idcard/StepDesign";
import StepExport from "@/components/idcard/StepExport";
import { loadState } from "@/lib/persistence";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const step = useIdStore((s) => s.step);
  const hydrate = useIdStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadState().then((s) => {
      if (!mounted) return;
      if (s && s.rows.length > 0) {
        hydrate(s);
        toast({
          title: "Previous session restored",
          description: `${s.rows.length} students · ${s.photos.length} photos loaded.`,
        });
      }
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [hydrate]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Stepper />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {step === 0 && <StepUpload />}
          {step === 1 && <StepMapping />}
          {step === 2 && <StepReview />}
          {step === 3 && <StepDesign />}
          {step === 4 && <StepExport />}
        </div>
      </main>
    </div>
  );
};

export default Index;
