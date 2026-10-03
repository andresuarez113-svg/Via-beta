import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Flag,
  MessageSquare,
  GitBranch,
  FormInput,
  Sparkles,
  Square,
  List,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KIND_META, type BotKind, type BotNode } from "@/lib/flow/types";
import { branchesFrom } from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";

const ICONS: Record<BotKind, typeof Flag> = {
  start: Flag,
  message: MessageSquare,
  question: GitBranch,
  list: List,
  input: FormInput,
  media: Image,
  ai: Sparkles,
  end: Square,
};

function BotNodeView({ id, data, selected }: NodeProps<BotNode>) {
  const active = useFlowStore((s) => s.activeNodeId === id);
  const Icon = ICONS[data.kind];
  const showTarget = data.kind !== "start";
  const branched = branchesFrom(data.kind);
  const showSource = data.kind !== "end" && !branched;
  const preview =
    data.kind === "ai"
      ? data.aiPrompt || "Respuesta generada"
      : data.text || KIND_META[data.kind].hint;

  return (
    <div
      className={cn(
        "w-[232px] rounded-[18px] bg-surface p-1.5 shadow-[var(--shadow-border)]",
        "transition-[box-shadow] duration-150 ease-out",
        selected && "shadow-[var(--shadow-border-hover)] ring-1 ring-forest/30",
        active && "ring-2 ring-forest",
      )}
    >
      {showTarget ? <Handle type="target" position={Position.Left} /> : null}

      <div className="rounded-[12px] bg-raised/70 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-surface text-forest">
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium tracking-wide text-subtle uppercase">
              {KIND_META[data.kind].label}
            </p>
            <p className="truncate text-sm font-medium text-ink">{data.title}</p>
          </div>
        </div>
        {data.kind !== "start" ? (
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-muted">{preview}</p>
        ) : (
          <p className="mt-2 text-xs text-muted">Arranca la conversación</p>
        )}
      </div>

      {branched ? (
        <div className="mt-1.5 space-y-1">
          {data.options.map((opt) => (
            <div
              key={opt.id}
              className="relative rounded-[10px] bg-surface px-3 py-1.5 text-xs text-ink"
            >
              <span className="block truncate pr-2">{opt.label || "Opción"}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={opt.id}
                style={{ top: "50%" }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {showSource ? <Handle type="source" position={Position.Right} /> : null}
    </div>
  );
}

export const BotNodeCard = memo(BotNodeView);
