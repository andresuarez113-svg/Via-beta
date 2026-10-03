import {
  Flag,
  FormInput,
  GitBranch,
  Image,
  List,
  MessageSquare,
  Sparkles,
  Square,
} from "lucide-react";
import { KIND_META, type BotKind } from "@/lib/flow/types";
import { useFlowStore } from "@/lib/flow/store";
import { cn } from "@/lib/utils";

const ITEMS: { kind: BotKind; icon: typeof Flag }[] = [
  { kind: "message", icon: MessageSquare },
  { kind: "question", icon: GitBranch },
  { kind: "list", icon: List },
  { kind: "input", icon: FormInput },
  { kind: "media", icon: Image },
  { kind: "ai", icon: Sparkles },
  { kind: "end", icon: Square },
  { kind: "start", icon: Flag },
];

export function Palette({
  className,
  onAdded,
}: {
  className?: string;
  onAdded?: () => void;
}) {
  const addNodeAt = useFlowStore((s) => s.addNodeAt);

  return (
    <aside className={cn("flex flex-col gap-1", className)}>
      <p className="px-1 pb-1 text-[11px] font-medium tracking-wide text-subtle uppercase">
        Líneas de WhatsApp
      </p>
      <p className="px-1 pb-3 text-xs leading-snug text-muted">
        Arrastra o toca para añadir. Conecta cada punto con el siguiente.
      </p>
      {ITEMS.map(({ kind, icon: Icon }) => {
        const meta = KIND_META[kind];
        return (
          <button
            key={kind}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/via-kind", kind);
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => {
              addNodeAt(kind, {
                x: 180 + Math.random() * 160,
                y: 80 + Math.random() * 280,
              });
              onAdded?.();
            }}
            className="flex items-start gap-3 rounded-xl p-2.5 text-left hover:bg-raised transition-[background-color] duration-150 ease-out"
          >
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface text-forest shadow-[var(--shadow-border)]">
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{meta.addLabel}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">
                {meta.hint}
              </span>
            </span>
          </button>
        );
      })}
    </aside>
  );
}
