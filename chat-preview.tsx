import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheck, ChevronRight, ImageIcon, RotateCcw, Send } from "lucide-react";
import { cn, uid } from "@/lib/utils";
import { replyAsBot } from "@/lib/flow/ai";
import {
  describeNode,
  findStart,
  follow,
  nextAfterSay,
} from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";
import type { BotNode, BotOption, ChatMessage } from "@/lib/flow/types";

type Waiting = "idle" | "option" | "text" | "ai" | "done";

function clock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function looksLikeUnknownAnswer(text: string): boolean {
  const normalized = text.toLowerCase();
  const signals = [
    "no sé",
    "no se ",
    "no tengo información",
    "no tengo informacion",
    "no dispongo de información",
    "no dispongo de informacion",
    "no puedo ayudarte con",
    "no puedo responder",
    "no estoy seguro",
    "no estoy segura",
    "desconozco",
    "no conozco",
    "no tengo datos",
    "no cuento con esa información",
    "no cuento con esa informacion",
  ];
  return signals.some((signal) => normalized.includes(signal));
}

export function ChatPreview() {
  const revision = useFlowStore((s) => s.revision);
  const setActiveNodeId = useFlowStore((s) => s.setActiveNodeId);
  const identity = useFlowStore((s) => s.identity);
  const trainingEnabled = useFlowStore((s) => s.trainingEnabled);
  const trainingExamples = useFlowStore((s) => s.trainingExamples);
  const addLearningCandidate = useFlowStore((s) => s.addLearningCandidate);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waiting, setWaiting] = useState<Waiting>("idle");
  const [draft, setDraft] = useState("");
  const [optionMessageId, setOptionMessageId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const varsRef = useRef<Record<string, string>>({});
  const logRef = useRef<ChatMessage[]>([]);
  const runId = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentNodeRef = useRef<BotNode | null>(null);

  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    const full: ChatMessage = { ...msg, id: uid("m") };
    logRef.current = [...logRef.current, full];
    setMessages(logRef.current);
    return full;
  }, []);

  const play = useCallback(
    async (node: BotNode | undefined, token: number) => {
      const graph = useFlowStore.getState().nodes;
      const links = useFlowStore.getState().edges;
      if (token !== runId.current) return;

      if (!node) {
        currentNodeRef.current = null;
        setActiveNodeId(null);
        setWaiting("done");
        push({
          role: "note",
          text: "Esta línea no está conectada. Une los nodos en el lienzo y vuelve a probar.",
        });
        return;
      }

      currentNodeRef.current = node;
      setActiveNodeId(node.id);
      const step = describeNode(node, varsRef.current);

      if (step.kind === "say") {
        if (step.text || step.variant === "media") {
          push({
            role: "bot",
            text: step.text,
            variant: step.variant ?? "text",
          });
        }
        const next =
          node.data.kind === "start"
            ? follow(graph, links, node.id)
            : nextAfterSay(graph, links, node);
        await play(next, token);
        return;
      }

      if (step.kind === "ask-option") {
        if (!step.options?.length) {
          push({ role: "note", text: "Esta pregunta no tiene opciones." });
          setWaiting("done");
          return;
        }
        const posted = push({
          role: "bot",
          text: step.text,
          options: step.options,
          variant: step.variant ?? "buttons",
          listButton: step.listButton,
        });
        setOptionMessageId(posted.id);
        setWaiting("option");
        return;
      }

      if (step.kind === "ask-text") {
        push({ role: "bot", text: step.text, variant: "text" });
        setWaiting("text");
        return;
      }

      if (step.kind === "ai") {
        setWaiting("ai");
        const transcript = logRef.current
          .filter((m) => m.role === "bot" || m.role === "user")
          .map((m) => ({ role: m.role as "bot" | "user", text: m.text }));
        const result = await replyAsBot({
          data: {
            prompt: step.aiPrompt || "Eres un bot de WhatsApp breve y amable.",
            history: transcript,
            variables: varsRef.current,
            trainingEnabled,
            trainingExamples,
          },
        });
        if (token !== runId.current) return;
        const botText = result.ok ? result.text : result.error;
        push({
          role: "bot",
          text: botText,
          variant: "text",
        });
        if (result.ok && trainingEnabled && looksLikeUnknownAnswer(botText)) {
          const lastUser = [...logRef.current].reverse().find((m) => m.role === "user")?.text;
          if (lastUser) {
            addLearningCandidate(lastUser, botText);
            push({
              role: "note",
              text: "Vía detectó una pregunta que quizá no sabe responder. Revisa Entrenar para enseñarle la respuesta.",
            });
          }
        }
        const next = follow(graph, links, node.id);
        await play(next, token);
        return;
      }

      if (step.kind === "end") {
        if (step.text) push({ role: "bot", text: step.text, variant: "text" });
        setWaiting("done");
      }
    },
    [addLearningCandidate, push, setActiveNodeId, trainingEnabled, trainingExamples],
  );

  const restart = useCallback(() => {
    runId.current += 1;
    const token = runId.current;
    varsRef.current = {};
    logRef.current = [];
    currentNodeRef.current = null;
    setMessages([]);
    setDraft("");
    setWaiting("idle");
    setOptionMessageId(null);
    setListOpen(false);
    const start = findStart(useFlowStore.getState().nodes);
    void play(start, token);
  }, [play]);

  useEffect(() => {
    restart();
    return () => {
      runId.current += 1;
      setActiveNodeId(null);
    };
  }, [revision, restart, setActiveNodeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, waiting, listOpen]);

  function choose(optionId: string, label: string) {
    if (waiting !== "option") return;
    const node = currentNodeRef.current;
    if (node?.data.variable) {
      varsRef.current[node.data.variable] = label;
    }
    varsRef.current.last_choice = label;
    push({ role: "user", text: label, variant: "text" });
    setWaiting("idle");
    setOptionMessageId(null);
    setListOpen(false);
    const next = follow(
      useFlowStore.getState().nodes,
      useFlowStore.getState().edges,
      node?.id ?? "",
      optionId,
    );
    void play(next, runId.current);
  }

  function submitText() {
    const text = draft.trim();
    if (!text || waiting !== "text") return;
    const node = currentNodeRef.current;
    const key = node?.data.variable || "dato";
    varsRef.current[key] = text;
    push({ role: "user", text, variant: "text" });
    setDraft("");
    setWaiting("idle");
    const next = follow(
      useFlowStore.getState().nodes,
      useFlowStore.getState().edges,
      node?.id ?? "",
    );
    void play(next, runId.current);
  }

  const initial = (identity.business.trim()[0] ?? "W").toUpperCase();
  const activeList = messages.find((m) => m.id === optionMessageId && m.variant === "list");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-wa-bar shadow-[var(--shadow-border)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2.5 text-wa-fg">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-wa-accent text-sm font-medium">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{identity.business}</p>
          <p className="truncate text-[11px] text-wa-fg/70">
            {waiting === "ai" ? "escribiendo…" : identity.about}
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="inline-flex size-9 items-center justify-center rounded-full text-wa-fg/80 hover:bg-wa-fg/10"
          aria-label="Reiniciar chat"
        >
          <RotateCcw className="size-4" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="wa-wallpaper absolute inset-0" />
        <div className="relative h-full overflow-y-auto px-2.5 py-3">
          <p className="mx-auto mb-3 w-fit rounded-md bg-wa-system px-2 py-1 text-center text-[10px] text-muted">
            WhatsApp · los mensajes están cifrados
          </p>
          <div className="flex flex-col gap-1.5">
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                waiting={waiting}
                optionMessageId={optionMessageId}
                onChoose={choose}
                onOpenList={() => setListOpen(true)}
              />
            ))}
            {waiting === "done" ? (
              <p className="pt-2 text-center text-[11px] text-muted">Conversación cerrada</p>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>

        {listOpen && activeList?.options ? (
          <div className="absolute inset-0 z-10 flex flex-col justify-end bg-ink/40">
            <div className="rounded-t-2xl bg-surface p-3">
              <p className="mb-2 text-sm font-medium text-ink">
                {activeList.listButton || "Ver opciones"}
              </p>
              <div className="max-h-56 overflow-y-auto">
                {activeList.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt.id, opt.label)}
                    className="flex h-11 w-full items-center justify-between border-t border-line text-left text-sm text-ink"
                  >
                    {opt.label}
                    <ChevronRight className="size-4 text-subtle" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 h-10 w-full rounded-xl text-sm text-muted"
                onClick={() => setListOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="flex shrink-0 items-center gap-1.5 bg-wa-compose px-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitText();
        }}
      >
        <input
          suppressHydrationWarning
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={waiting === "text" ? "Mensaje" : "Mensaje"}
          disabled={waiting !== "text"}
          aria-label="Mensaje"
          className="h-10 min-w-0 flex-1 rounded-full bg-surface px-4 text-sm text-ink outline-none placeholder:text-subtle disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={waiting !== "text" || !draft.trim()}
          className="inline-flex size-10 items-center justify-center rounded-full bg-wa-accent text-wa-fg disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function Bubble({
  message: m,
  waiting,
  optionMessageId,
  onChoose,
  onOpenList,
}: {
  message: ChatMessage;
  waiting: Waiting;
  optionMessageId: string | null;
  onChoose: (id: string, label: string) => void;
  onOpenList: () => void;
}) {
  if (m.role === "note") {
    return (
      <p className="mx-auto max-w-[92%] rounded-md bg-wa-system px-2 py-1 text-center text-[11px] text-muted">
        {m.text}
      </p>
    );
  }

  const mine = m.role === "user";
  const live = waiting === "option" && optionMessageId === m.id;

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug shadow-sm",
          mine ? "rounded-tr-none bg-wa-out text-ink" : "rounded-tl-none bg-wa-in text-ink",
        )}
      >
        {m.variant === "media" ? (
          <div className="mb-1.5 overflow-hidden rounded-md bg-raised">
            <div className="flex h-28 items-center justify-center bg-sage/25 text-forest">
              <ImageIcon className="size-8" strokeWidth={1.5} />
            </div>
          </div>
        ) : null}
        {m.text ? <p className="whitespace-pre-wrap">{m.text}</p> : null}
        {m.variant === "buttons" && m.options?.length ? (
          <div className="mt-1.5 flex flex-col divide-y divide-line border-t border-line">
            {m.options.map((opt: BotOption) => (
              <button
                key={opt.id}
                type="button"
                disabled={!live}
                onClick={() => onChoose(opt.id, opt.label)}
                className="h-9 text-center text-[13px] font-medium text-wa-link disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
        {m.variant === "list" && m.options?.length ? (
          <button
            type="button"
            disabled={!live}
            onClick={onOpenList}
            className="mt-1.5 flex h-9 w-full items-center justify-center gap-1 border-t border-line text-[13px] font-medium text-wa-link disabled:opacity-50"
          >
            {m.listButton || "Ver opciones"}
          </button>
        ) : null}
        <span className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-subtle">
          {clock()}
          {mine ? <CheckCheck className="size-3 text-wa-tick" /> : null}
        </span>
      </div>
    </div>
  );
}
