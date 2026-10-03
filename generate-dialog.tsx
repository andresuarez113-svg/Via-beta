import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { generateFlowFromBrief, getAiStatus } from "@/lib/flow/ai";
import { applyGeneratedFlow } from "@/lib/flow/store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function GenerateDialog() {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getAiStatus().then((s) => {
      if (!cancelled) setAvailable(s.available);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function generate() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await generateFlowFromBrief({ data: { brief } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      applyGeneratedFlow(result.flow);
      setOpen(false);
      setBrief("");
      toast.success("Flujo listo. Pruébalo en el chat.");
    } catch {
      toast.error("No se pudo generar el flujo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Generar flujo</span>
          <span className="sm:hidden">Generar</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Generar un flujo"
        description="Describe el bot. Vía arma los nodos y las conexiones."
      >
        {available === false ? (
          <p className="text-sm text-muted">
            La generación con IA no está disponible en este entorno. Usa una plantilla.
          </p>
        ) : (
          <>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Bot para una pizzería que toma pedidos, pregunta el tamaño y confirma el nombre."
              className="min-h-32"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void generate()}
                disabled={busy || brief.trim().length < 8}
              >
                {busy ? "Armando…" : "Crear flujo"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
