import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, GitBranch, ShieldCheck } from "lucide-react";
import { useFlowStore } from "@/lib/flow/store";
import { Button } from "@/components/ui/button";
import type { BotNode } from "@/lib/flow/types";

export type FlowCheck = {
  level: "ok" | "warning" | "error";
  title: string;
  detail: string;
  nodeId?: string;
};

function outgoing(nodes: BotNode[], edges: ReturnType<typeof useFlowStore.getState>["edges"], id: string) {
  return edges.filter((edge) => edge.source === id);
}

export function runFlowChecks(
  nodes: BotNode[],
  edges: ReturnType<typeof useFlowStore.getState>["edges"],
  trainingEnabled: boolean,
  trainingExamples: ReturnType<typeof useFlowStore.getState>["trainingExamples"],
  learningCandidates: ReturnType<typeof useFlowStore.getState>["learningCandidates"],
): FlowCheck[] {
  const checks: FlowCheck[] = [];
  const starts = nodes.filter((node) => node.data.kind === "start");
  if (starts.length !== 1) {
    checks.push({ level: "error", title: "Debe existir un solo Inicio", detail: starts.length === 0 ? "Añade una línea de Inicio." : `Hay ${starts.length} líneas de Inicio.`, nodeId: starts[0]?.id });
  } else {
    checks.push({ level: "ok", title: "Inicio configurado", detail: "El bot tiene un único punto de entrada." });
  }

  const start = starts[0];
  const reachable = new Set<string>();
  if (start) {
    const queue = [start.id];
    while (queue.length) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const edge of edges) {
        if (edge.source === id && !reachable.has(edge.target)) queue.push(edge.target);
      }
    }
  }

  const orphaned = nodes.filter((node) => !reachable.has(node.id));
  if (orphaned.length) {
    checks.push({ level: "warning", title: `${orphaned.length} línea${orphaned.length === 1 ? " está" : "s están"} desconectada${orphaned.length === 1 ? "" : "s"}`, detail: "Estas líneas no se alcanzan desde Inicio. Puedes conectarlas o eliminarlas.", nodeId: orphaned[0].id });
  } else if (nodes.length) {
    checks.push({ level: "ok", title: "Todas las líneas son alcanzables", detail: "El flujo puede llegar a cada línea desde Inicio." });
  }

  for (const node of nodes) {
    const links = outgoing(nodes, edges, node.id);
    if (node.data.kind === "end") continue;

    if (["message", "input", "media", "ai", "start"].includes(node.data.kind) && links.length === 0) {
      checks.push({ level: "warning", title: `“${node.data.title || "Línea"}” no continúa`, detail: "No tiene una conexión de salida. La conversación terminará ahí.", nodeId: node.id });
    }

    if (["question", "list"].includes(node.data.kind)) {
      const missing = node.data.options.filter((option) => !links.some((edge) => edge.sourceHandle === option.id));
      if (missing.length) {
        checks.push({ level: "error", title: `“${node.data.title || "Línea"}” tiene opciones sin conectar`, detail: `Falta conectar: ${missing.map((option) => option.label).join(", ")}.`, nodeId: node.id });
      }
    }

    if (["message", "question", "list", "input", "media", "end"].includes(node.data.kind) && !node.data.text.trim()) {
      checks.push({ level: "warning", title: `“${node.data.title || "Línea"}” no tiene mensaje`, detail: "Añade el texto que verá el cliente.", nodeId: node.id });
    }

    if (node.data.kind === "input" && !node.data.variable.trim()) {
      checks.push({ level: "warning", title: `“${node.data.title || "Respuesta libre"}” no guarda el dato`, detail: "Pon un nombre de variable para poder reutilizar la respuesta.", nodeId: node.id });
    }

    if (node.data.kind === "ai" && !node.data.aiPrompt.trim()) {
      checks.push({ level: "warning", title: `“${node.data.title || "IA"}” no tiene instrucciones`, detail: "Añade instrucciones para orientar a la IA.", nodeId: node.id });
    }
  }

  const variables = nodes.filter((node) => node.data.kind === "input" && node.data.variable.trim()).map((node) => node.data.variable.trim().toLowerCase());
  const duplicates = [...new Set(variables.filter((value, index) => variables.indexOf(value) !== index))];
  if (duplicates.length) {
    checks.push({ level: "warning", title: "Hay variables repetidas", detail: `Se repiten: ${duplicates.join(", ")}. Usa nombres diferentes si guardan datos distintos.` });
  }

  if (learningCandidates.length) {
    checks.push({ level: "warning", title: `${learningCandidates.length} aprendizaje${learningCandidates.length === 1 ? " pendiente" : "s pendientes"}`, detail: "Hay preguntas que Vía detectó y todavía esperan tu aprobación." });
  } else if (trainingEnabled && trainingExamples.length) {
    checks.push({ level: "ok", title: "Aprendizaje preparado", detail: `${trainingExamples.length} ejemplo${trainingExamples.length === 1 ? "" : "s"} aprobado${trainingExamples.length === 1 ? "" : "s"} disponible${trainingExamples.length === 1 ? "" : "s"}.` });
  }

  if (!checks.some((check) => check.level === "error") && !checks.some((check) => check.level === "warning")) {
    checks.push({ level: "ok", title: "Bot listo para probar", detail: "No encontramos problemas de configuración en el flujo." });
  }
  return checks;
}

export function HealthCheck({ onSelectNode }: { onSelectNode: (id: string) => void }) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const trainingEnabled = useFlowStore((state) => state.trainingEnabled);
  const trainingExamples = useFlowStore((state) => state.trainingExamples);
  const learningCandidates = useFlowStore((state) => state.learningCandidates);
  const checks = useMemo(() => runFlowChecks(nodes, edges, trainingEnabled, trainingExamples, learningCandidates), [nodes, edges, trainingEnabled, trainingExamples, learningCandidates]);
  const errors = checks.filter((check) => check.level === "error").length;
  const warnings = checks.filter((check) => check.level === "warning").length;

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-raised p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-surface"><ShieldCheck className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Revisión de Vía</p>
            <p className="mt-1 text-xs leading-5 text-muted">Comprueba conexiones, mensajes, variables y aprendizaje antes de publicar o conectar tu bot.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface p-3"><p className="text-lg font-semibold">{errors}</p><p className="text-[11px] text-muted">Problemas</p></div>
          <div className="rounded-xl bg-surface p-3"><p className="text-lg font-semibold">{warnings}</p><p className="text-[11px] text-muted">Avisos</p></div>
        </div>
      </div>

      <div className="grid gap-2">
        {checks.map((check, index) => {
          const Icon = check.level === "ok" ? CheckCircle2 : check.level === "error" ? CircleAlert : AlertTriangle;
          return (
            <div key={`${check.title}-${index}`} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3">
              <Icon className={`mt-0.5 size-4 shrink-0 ${check.level === "ok" ? "text-forest" : check.level === "error" ? "text-danger" : "text-amber-600"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{check.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{check.detail}</p>
                {check.nodeId ? <Button variant="ghost" size="sm" className="mt-2 h-8 px-2" onClick={() => onSelectNode(check.nodeId!)}><GitBranch className="size-3.5" /> Ver línea</Button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
