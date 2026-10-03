import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { KIND_META, optionLimit } from "@/lib/flow/types";
import { useFlowStore } from "@/lib/flow/store";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function Inspector() {
  const selectedId = useFlowStore((s) => s.selectedId);
  const node = useFlowStore((s) => s.nodes.find((n) => n.id === s.selectedId));
  const identity = useFlowStore((s) => s.identity);
  const setIdentity = useFlowStore((s) => s.setIdentity);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const addOption = useFlowStore((s) => s.addOption);
  const removeOption = useFlowStore((s) => s.removeOption);
  const duplicateNode = useFlowStore((s) => s.duplicateNode);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const connectNodes = useFlowStore((s) => s.connectNodes);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  if (!node || !selectedId) {
    return (
      <div className="flex flex-col gap-4 px-1 py-2">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">
            Perfil de WhatsApp
          </p>
          <p className="mt-1 text-sm text-muted">
            Así te ve el cliente. Selecciona un nodo para editar esa línea del flujo.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="biz-name">Nombre del negocio</Label>
          <Input
            id="biz-name"
            value={identity.business}
            onChange={(e) => setIdentity({ business: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="biz-about">Estado</Label>
          <Input
            id="biz-about"
            value={identity.about}
            onChange={(e) => setIdentity({ about: e.target.value })}
          />
        </div>
      </div>
    );
  }

  const kind = node.data.kind;
  const max = optionLimit(kind);
  const branched = kind === "question" || kind === "list";
  const targets = nodes.filter((candidate) => candidate.id !== node.id && candidate.data.kind !== "start");
  const targetFor = (sourceHandle?: string) =>
    edges.find(
      (edge) =>
        edge.source === node.id &&
        (edge.sourceHandle ?? undefined) === (sourceHandle ?? undefined),
    )?.target ?? "";

  const ConnectionSelect = ({
    sourceHandle,
    label,
  }: {
    sourceHandle?: string;
    label: string;
  }) => (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={targetFor(sourceHandle)}
          onChange={(e) => connectNodes(node.id, e.target.value || null, sourceHandle)}
          className="h-11 w-full appearance-none rounded-xl bg-surface px-3.5 pr-9 text-sm text-ink shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-forest/35"
        >
          <option value="">Sin conexión</option>
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.data.title} · {KIND_META[target.data.kind].label}
            </option>
          ))}
        </select>
        <Link2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">
          {KIND_META[kind].label}
        </p>
        <div className="mt-2 grid gap-1.5">
          <Label htmlFor="node-title">Título en el lienzo</Label>
          <Input
            id="node-title"
            value={node.data.title}
            onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
          />
        </div>
      </div>

      {kind !== "start" && kind !== "ai" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="node-text">
            {kind === "media" ? "Pie de foto" : "Texto del mensaje"}
          </Label>
          <Textarea
            id="node-text"
            value={node.data.text}
            onChange={(e) => updateNodeData(node.id, { text: e.target.value })}
            placeholder="Lo que envía el bot en WhatsApp"
          />
          <p className="text-[11px] text-subtle">
            Usa {"{variable}"} para insertar un dato, por ejemplo {"{nombre}"}.
          </p>
        </div>
      ) : null}

      {kind === "start" ? (
        <p className="text-sm text-muted">
          Conecta este nodo con el primer mensaje. El cliente no lo ve: es el arranque
          de tus líneas.
        </p>
      ) : null}

      {kind === "ai" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="node-ai">Instrucciones para Grok</Label>
          <Textarea
            id="node-ai"
            value={node.data.aiPrompt}
            onChange={(e) => updateNodeData(node.id, { aiPrompt: e.target.value })}
            className="min-h-32"
          />
        </div>
      ) : null}

      {kind === "input" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="node-var">Guardar respuesta en</Label>
          <Input
            id="node-var"
            value={node.data.variable}
            onChange={(e) =>
              updateNodeData(node.id, {
                variable: e.target.value.replace(/\s+/g, "_"),
              })
            }
            placeholder="nombre"
          />
        </div>
      ) : null}

      {kind === "list" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="list-btn">Texto del botón de la lista</Label>
          <Input
            id="list-btn"
            value={node.data.listButton}
            maxLength={20}
            onChange={(e) => updateNodeData(node.id, { listButton: e.target.value })}
            placeholder="Ver opciones"
          />
        </div>
      ) : null}

      {kind !== "end" ? (
        <div className="grid gap-3 rounded-2xl bg-raised p-3">
          <div className="flex items-start gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-forest shadow-[var(--shadow-border)]">
              <Link2 className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Conecta la línea</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">
                No tienes que arrastrar cables: elige qué línea sigue después.
              </p>
            </div>
          </div>
          {!branched ? <ConnectionSelect label="Siguiente línea" /> : null}
          {branched ? (
            <div className="grid gap-2">
              {node.data.options.map((opt) => (
                <ConnectionSelect
                  key={opt.id}
                  sourceHandle={opt.id}
                  label={`Después de “${opt.label}”`}
                />
              ))}
            </div>
          ) : null}
          <p className="flex items-center gap-1.5 text-[11px] text-subtle">
            <Check className="size-3.5 text-forest" />
            Los cambios se guardan automáticamente.
          </p>
        </div>
      ) : null}

      {branched ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>
              {kind === "question" ? "Botones (máx. 3)" : "Filas de la lista (máx. 10)"}
            </Label>
            <button
              type="button"
              className="text-xs font-medium text-forest hover:text-forest-deep disabled:opacity-40"
              disabled={node.data.options.length >= max}
              onClick={() => addOption(node.id)}
            >
              Añadir
            </button>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="q-var">Guardar elección en</Label>
            <Input
              id="q-var"
              value={node.data.variable}
              onChange={(e) =>
                updateNodeData(node.id, {
                  variable: e.target.value.replace(/\s+/g, "_"),
                })
              }
              placeholder="pedido"
            />
          </div>
          {node.data.options.map((opt, i) => (
            <div key={opt.id} className="flex gap-2">
              <Input
                value={opt.label}
                maxLength={kind === "question" ? 20 : 24}
                aria-label={`Opción ${i + 1}`}
                onChange={(e) => {
                  const options = node.data.options.map((o) =>
                    o.id === opt.id ? { ...o, label: e.target.value } : o,
                  );
                  updateNodeData(node.id, { options });
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted hover:text-danger"
                disabled={node.data.options.length <= 2}
                onClick={() => removeOption(node.id, opt.id)}
                aria-label="Quitar opción"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <p className="text-[11px] text-subtle">
            Arrastra el punto de cada opción al siguiente nodo para crear la línea.
          </p>
        </div>
      ) : null}

      {kind !== "start" ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => duplicateNode(node.id)}>
            <Copy className="size-3.5" />
            Duplicar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onNodesChange([{ type: "remove", id: node.id }])}
          >
            Eliminar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
