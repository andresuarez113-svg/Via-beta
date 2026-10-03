import { createServerFn } from "@tanstack/react-start";
import {
  emptyData,
  type BotKind,
  type SerializedFlow,
  type SerializedNode,
  type TrainingExample,
} from "./types";

const KINDS = new Set<BotKind>([
  "start",
  "message",
  "question",
  "list",
  "input",
  "media",
  "ai",
  "end",
]);

export const getAiStatus = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ available: boolean }> => {
    return { available: Boolean(process.env.XAI_API_KEY) };
  },
);

type ChatOk = { ok: true; text: string };
type ChatErr = { ok: false; error: string };
type ChatResult = ChatOk | ChatErr;

async function complete(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number,
): Promise<ChatResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "La IA no está disponible ahora." };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      messages,
      max_tokens: maxTokens,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `No pude hablar con Grok (${res.status}).` };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "Grok devolvió una respuesta vacía." };
  return { ok: true, text };
}

export const replyAsBot = createServerFn({ method: "POST" })
  .validator((input: {
    prompt: string;
    history: { role: "user" | "bot"; text: string }[];
    variables: Record<string, string>;
    trainingExamples?: TrainingExample[];
    trainingEnabled?: boolean;
  }) => input)
  .handler(async ({ data }): Promise<ChatResult> => {
    const history = data.history.slice(-12).map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text.slice(0, 600),
    }));
    const vars = Object.entries(data.variables)
      .slice(0, 20)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const training = data.trainingEnabled !== false
      ? (data.trainingExamples ?? []).slice(0, 30).map((e) => `Cliente: ${e.user}\nBot: ${e.answer}`).join("\n\n")
      : "";
    return complete(
      [
        {
          role: "system",
          content:
            `${data.prompt.slice(0, 800)}\n` +
            (vars ? `Variables: ${vars}\n` : "") +
            (training ? `Ejemplos aprobados de entrenamiento:\n${training}\n` : "") +
            "Usa los ejemplos aprobados como guía cuando sean relevantes, pero no inventes datos que no aparezcan en ellos. Si no tienes información suficiente para responder con seguridad, dilo claramente con una frase como 'No tengo esa información todavía.' Responde solo el mensaje del bot, 1 a 3 frases, sin markdown ni comillas.",
        },
        ...history,
      ],
      220,
    );
  });

type GenNode = {
  id: string;
  kind: BotKind;
  title: string;
  text: string;
  options?: { id: string; label: string }[];
  variable?: string;
  aiPrompt?: string;
};

type GenPayload = {
  name: string;
  nodes: GenNode[];
  edges: { source: string; target: string; sourceHandle?: string }[];
};

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no-json");
  return JSON.parse(text.slice(start, end + 1));
}

function toSerialized(payload: GenPayload): SerializedFlow {
  const nodes: SerializedNode[] = payload.nodes
    .filter((n) => n.id && KINDS.has(n.kind))
    .slice(0, 18)
    .map((n) => {
      const base = emptyData(n.kind);
      const branched = n.kind === "question" || n.kind === "list";
      const limit = n.kind === "list" ? 10 : 3;
      const options = branched
        ? (n.options ?? [])
            .filter((o) => o.label?.trim())
            .slice(0, limit)
            .map((o, i) => ({
              id: o.id || `opt_${i}`,
              label: o.label.trim().slice(0, n.kind === "question" ? 20 : 24),
            }))
        : [];
      if (n.kind === "question" && options.length < 2) {
        options.push(
          { id: "opt_a", label: "Sí" },
          { id: "opt_b", label: "No" },
        );
      }
      return {
        id: n.id,
        kind: n.kind,
        title: (n.title || base.title).slice(0, 40),
        text: (n.text || "").slice(0, 320),
        options,
        variable: (n.variable || base.variable).slice(0, 32),
        aiPrompt: (n.aiPrompt || base.aiPrompt).slice(0, 400),
        listButton: (n as { listButton?: string }).listButton ?? base.listButton,
      };
    });

  if (!nodes.some((n) => n.kind === "start") && nodes[0]) {
    nodes[0].kind = "start";
  }

  const ids = new Set(nodes.map((n) => n.id));
  const edges = payload.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)
    .slice(0, 40)
    .map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
    }));

  return {
    name: (payload.name || "Flujo generado").slice(0, 48),
    nodes,
    edges,
  };
}

export const generateFlowFromBrief = createServerFn({ method: "POST" })
  .validator((input: { brief: string }) => input)
  .handler(async ({ data }): Promise<ChatOk & { flow: SerializedFlow } | ChatErr> => {
    const brief = data.brief.trim().slice(0, 500);
    if (brief.length < 8) {
      return { ok: false, error: "Describe el bot con un poco más de detalle." };
    }

    const result = await complete(
      [
        {
          role: "system",
          content: `Diseñas flujos de bots conversacionales. Devuelve SOLO JSON válido con esta forma:
{"name":"string","nodes":[{"id":"start","kind":"start"|"message"|"question"|"input"|"ai"|"end","title":"string","text":"string","options":[{"id":"opt1","label":"string"}],"variable":"string","aiPrompt":"string"}],"edges":[{"source":"id","target":"id","sourceHandle":"opt id if question"}]}
Reglas:
- Un único nodo start, un end.
- 6 a 12 nodos. Textos en el idioma del brief, cortos, naturales, de tú.
- Preguntas: 2-3 botones (kind question) o lista (kind list) con sourceHandle = option.id.
- input tiene variable en snake_case. Mensajes posteriores pueden usar {variable}.
- Usa un nodo ai solo si el brief pide preguntas libres.
- ids cortos en ascii (start, n1, n2...).`,
        },
        { role: "user", content: brief },
      ],
      1400,
    );

    if (!result.ok) return result;

    try {
      const parsed = extractJson(result.text) as GenPayload;
      if (!Array.isArray(parsed?.nodes) || parsed.nodes.length < 3) {
        return { ok: false, error: "El flujo generado venía incompleto. Prueba otra vez." };
      }
      return { ok: true, text: "ok", flow: toSerialized(parsed) };
    } catch {
      return {
        ok: false,
        error: "No pude leer el flujo. Reformula la idea y reintenta.",
      };
    }
  });
