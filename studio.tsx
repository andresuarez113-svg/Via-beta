import { useEffect, useState } from "react";
import { Brain, Check, Download, MessageSquare, ShieldCheck } from "lucide-react";
import { TEMPLATES } from "@/lib/flow/templates";
import { useFlowStore } from "@/lib/flow/store";
import { exportWhatsAppJson } from "@/lib/flow/export";
import { ViaMark } from "./logo";
import { Palette } from "./palette";
import { Inspector } from "./inspector";
import { ChatPreview } from "./chat-preview";
import { TrainingPanel } from "./training-panel";
import { HealthCheck } from "./health-check";
import { GenerateDialog } from "./generate-dialog";
import { FlowCanvas } from "./flow-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MobileTab = "flow" | "bot" | "training";
type SideTab = "node" | "bot" | "training" | "review";

export function Studio({
  onBackToWorkshop,
  onFinishBot,
}: {
  onBackToWorkshop?: () => void;
  onFinishBot?: (name: string) => void;
}) {
  const hydrate = useFlowStore((s) => s.hydrate);
  const name = useFlowStore((s) => s.name);
  const setName = useFlowStore((s) => s.setName);
  const loadTemplate = useFlowStore((s) => s.loadTemplate);
  const resetBlank = useFlowStore((s) => s.resetBlank);
  const selectedId = useFlowStore((s) => s.selectedId);
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const identity = useFlowStore((s) => s.identity);
  const learningCandidates = useFlowStore((s) => s.learningCandidates);

  const [mobileTab, setMobileTab] = useState<MobileTab>("flow");
  const [sideTab, setSideTab] = useState<SideTab>("bot");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishName, setFinishName] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (selectedId) setSideTab("node");
  }, [selectedId]);

  const blank = edges.length === 0;

  const openFinish = () => {
    setFinishName(name === "Borrador sin nombre" || name === "Mi bot de WhatsApp" ? "" : name);
    setFinishOpen(true);
  };

  const finish = () => {
    const cleanName = finishName.trim() || "Mi bot";
    setName(cleanName);
    onFinishBot?.(cleanName);
    setFinishOpen(false);
  };

  return (
    <div className="flex h-dvh flex-col bg-bg text-ink">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
        {onBackToWorkshop ? (
          <Button variant="ghost" size="sm" onClick={onBackToWorkshop} aria-label="Volver al taller">
            Taller
          </Button>
        ) : null}
        <ViaMark className="size-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nombre del flujo"
            className="h-9 max-w-xs border-0 bg-transparent px-1 shadow-none font-display text-base tracking-tight focus-visible:ring-0"
          />
        </div>
        <span className="hidden items-center rounded-full bg-wa-bar px-2.5 py-1 text-[11px] font-medium text-wa-fg sm:inline-flex">
          WhatsApp
        </span>
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Plantillas
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Empezar un flujo"
            description="Lienzo en blanco para tus líneas, o una plantilla de WhatsApp."
          >
            <button
              type="button"
              className="mb-2 w-full rounded-xl bg-forest px-4 py-3 text-left text-surface"
              onClick={() => {
                resetBlank();
                setTemplatesOpen(false);
              }}
            >
              <span className="block text-sm font-medium">Crear mis líneas</span>
              <span className="mt-0.5 block text-xs text-wa-fg/80">
                Lienzo en blanco. Añade nodos y conéctalos.
              </span>
            </button>
            <div className="grid gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="rounded-xl bg-raised px-4 py-3 text-left hover:bg-line"
                  onClick={() => {
                    loadTemplate(t.id);
                    setTemplatesOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium">{t.flow.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{t.blurb}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant={mobileTab === "training" ? "default" : "ghost"}
          size="sm"
          className="md:hidden"
          onClick={() => setMobileTab("training")}
          aria-label="Entrenar bot"
        >
          <Brain className="size-3.5" />
          Entrenar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setReviewOpen(true)} aria-label="Revisar bot">
          <ShieldCheck className="size-3.5" />
          <span className="hidden sm:inline">Revisar</span>
        </Button>
        <GenerateDialog />
        <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={openFinish}>
          <Check className="size-3.5" />
          Terminar bot
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() =>
            exportWhatsAppJson({
              name,
              identity,
              nodes,
              edges,
            })
          }
        >
          <Download className="size-3.5" />
          Exportar
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[232px] shrink-0 overflow-y-auto border-r border-line p-3 lg:block">
          <Palette />
        </div>

        <main className="relative min-h-0 min-w-0 flex-1">
          <div
            className={cn(
              "absolute inset-0",
              mobileTab !== "flow" ? "hidden md:block" : "block",
            )}
          >
            {mounted ? (
              <FlowCanvas />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                Cargando lienzo…
              </div>
            )}
            {blank && mobileTab === "flow" ? (
              <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4">
                <div className="rounded-2xl bg-surface/95 px-4 py-3 text-center shadow-[var(--shadow-border)]">
                  <p className="font-display text-base text-ink">Crea tus líneas</p>
                  <p className="mt-1 max-w-xs text-xs text-muted">
                    Añade las líneas que quieras. Puedes conectarlas desde el panel de cada
                    línea, sin necesidad de arrastrar cables.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          {mobileTab === "bot" ? (
            <div className="absolute inset-0 bg-bg p-3 md:hidden">
              <ChatPreview />
            </div>
          ) : null}
          {mobileTab === "training" ? (
            <div className="absolute inset-0 overflow-y-auto bg-bg p-3 md:hidden">
              <TrainingPanel />
            </div>
          ) : null}
        </main>

        <aside className="hidden w-[320px] shrink-0 flex-col border-l border-line p-3 md:flex lg:w-[340px]">
          <div className="mb-3 flex rounded-xl bg-raised p-1">
            <button
              type="button"
              onClick={() => setSideTab("bot")}
              className={cn(
                "h-9 flex-1 rounded-[10px] text-sm font-medium",
                sideTab === "bot"
                  ? "bg-surface text-ink shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setSideTab("node")}
              className={cn(
                "h-9 flex-1 rounded-[10px] text-sm font-medium",
                sideTab === "node"
                  ? "bg-surface text-ink shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              Línea
            </button>
            <button
              type="button"
              onClick={() => setSideTab("training")}
              className={cn(
                "h-9 flex-1 rounded-[10px] text-sm font-medium",
                sideTab === "training"
                  ? "bg-surface text-ink shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              Entrenar
              {learningCandidates.length > 0 ? (
                <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] text-white">{learningCandidates.length}</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setSideTab("review")}
              className={cn(
                "h-9 flex-1 rounded-[10px] text-sm font-medium",
                sideTab === "review"
                  ? "bg-surface text-ink shadow-[var(--shadow-border)]"
                  : "text-muted",
              )}
            >
              Revisar
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <div
              className={cn(
                "absolute inset-0",
                sideTab === "bot" ? "block" : "pointer-events-none invisible",
              )}
            >
              <ChatPreview />
            </div>
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto",
                sideTab === "node" ? "block" : "pointer-events-none invisible",
              )}
            >
              <Inspector />
            </div>
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto",
                sideTab === "training" ? "block" : "pointer-events-none invisible",
              )}
            >
              <TrainingPanel />
            </div>
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto",
                sideTab === "review" ? "block" : "pointer-events-none invisible",
              )}
            >
              <HealthCheck onSelectNode={(id) => { useFlowStore.getState().setSelectedId(id); setSideTab("node"); }} />
            </div>
          </div>
        </aside>
      </div>

      {selectedId && mobileTab === "flow" ? (
        <div className="max-h-[46%] overflow-y-auto border-t border-line bg-surface p-3 md:hidden">
          <Inspector />
        </div>
      ) : null}

      {reviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-3 sm:p-4">
          <div className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-3xl bg-surface shadow-[var(--shadow-border-hover)]">
            <div className="flex items-center gap-3 border-b border-line p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-surface"><ShieldCheck className="size-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="font-display text-xl">Revisar bot</h2><p className="text-xs text-muted">Una revisión rápida antes de conectarlo a WhatsApp.</p></div>
              <Button variant="ghost" size="sm" onClick={() => setReviewOpen(false)}>Cerrar</Button>
            </div>
            <div className="min-h-0 overflow-y-auto p-5">
              <HealthCheck onSelectNode={(id) => { useFlowStore.getState().setSelectedId(id); setReviewOpen(false); setSideTab("node"); setMobileTab("flow"); }} />
            </div>
          </div>
        </div>
      ) : null}

      {finishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-[var(--shadow-border-hover)]">
            <div className="flex size-11 items-center justify-center rounded-xl bg-forest text-surface">
              <Check className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-2xl">Terminar bot</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Tu flujo se guarda automáticamente. Ponle el nombre con el que aparecerá en tu Taller.
            </p>
            <Input
              autoFocus
              value={finishName}
              onChange={(e) => setFinishName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") finish();
              }}
              className="mt-5 h-11"
              placeholder="Ej. Atención al cliente"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFinishOpen(false)}>Seguir editando</Button>
              <Button onClick={finish}>Guardar y terminar</Button>
            </div>
          </div>
        </div>
      ) : null}

      {paletteOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="Cerrar paleta"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-16 rounded-t-2xl bg-surface p-4 shadow-[var(--shadow-border-hover)] md:bottom-4">
            <Palette onAdded={() => setPaletteOpen(false)} />
          </div>
        </div>
      ) : null}

      <nav className="flex h-16 shrink-0 items-center gap-1 border-t border-line bg-surface px-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("flow")}
          className={cn(
            "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium",
            mobileTab === "flow" ? "text-forest" : "text-muted",
          )}
        >
          <GitBranch className="size-4" />
          Flujo
        </button>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex size-12 items-center justify-center rounded-xl bg-forest text-surface"
          aria-label="Añadir nodo"
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("bot")}
          className={cn(
            "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium",
            mobileTab === "bot" ? "text-forest" : "text-muted",
          )}
        >
          <MessageSquare className="size-4" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={openFinish}
          className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-forest"
        >
          <Check className="size-4" />
          Terminar
        </button>
      </nav>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="fixed right-4 bottom-4 z-20 hidden size-12 items-center justify-center rounded-xl bg-forest text-surface shadow-[var(--shadow-border-hover)] md:flex lg:hidden"
        aria-label="Añadir nodo"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}
