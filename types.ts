import type { Edge, Node } from "@xyflow/react";

export const BOT_KINDS = [
  "start",
  "message",
  "question",
  "list",
  "input",
  "media",
  "ai",
  "end",
] as const;

export type BotKind = (typeof BOT_KINDS)[number];

export type BotOption = {
  id: string;
  label: string;
};

export type BotIdentity = {
  business: string;
  about: string;
};

export type TrainingExample = {
  id: string;
  user: string;
  answer: string;
  createdAt: number;
};

export type LearningCandidate = {
  id: string;
  user: string;
  botAnswer: string;
  createdAt: number;
};

export type BotNodeData = {
  kind: BotKind;
  title: string;
  text: string;
  options: BotOption[];
  variable: string;
  aiPrompt: string;
  listButton: string;
};

export type BotNode = Node<BotNodeData, "bot">;
export type BotEdge = Edge;

export type FlowSnapshot = {
  name: string;
  nodes: BotNode[];
  edges: BotEdge[];
  identity?: BotIdentity;
  trainingEnabled?: boolean;
  trainingExamples?: TrainingExample[];
  learningCandidates?: LearningCandidate[];
};

export type SerializedNode = {
  id: string;
  kind: BotKind;
  title: string;
  text: string;
  options: BotOption[];
  variable: string;
  aiPrompt: string;
  listButton: string;
};

export type SerializedEdge = {
  source: string;
  target: string;
  sourceHandle?: string;
};

export type SerializedFlow = {
  name: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  identity?: BotIdentity;
};

export type ChatRole = "bot" | "user" | "note";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  options?: BotOption[];
  variant?: "text" | "buttons" | "list" | "media";
  listButton?: string;
};

export const KIND_META: Record<
  BotKind,
  { label: string; hint: string; addLabel: string }
> = {
  start: {
    label: "Inicio",
    hint: "Punto de entrada. Solo uno.",
    addLabel: "Inicio",
  },
  message: {
    label: "Texto",
    hint: "Mensaje de WhatsApp y sigue.",
    addLabel: "Texto",
  },
  question: {
    label: "Botones",
    hint: "Hasta 3 botones de respuesta.",
    addLabel: "Botones",
  },
  list: {
    label: "Lista",
    hint: "Menú desplegable de WhatsApp.",
    addLabel: "Lista",
  },
  input: {
    label: "Respuesta libre",
    hint: "El cliente escribe y lo guardas.",
    addLabel: "Respuesta libre",
  },
  media: {
    label: "Imagen",
    hint: "Foto con pie de foto y sigue.",
    addLabel: "Imagen",
  },
  ai: {
    label: "IA",
    hint: "Grok responde y el flujo sigue.",
    addLabel: "Nodo IA",
  },
  end: {
    label: "Fin",
    hint: "Cierra la conversación.",
    addLabel: "Fin",
  },
};

export function uidOption(): string {
  return `opt_${crypto.randomUUID().slice(0, 8)}`;
}

export function optionLimit(kind: BotKind): number {
  if (kind === "question") return 3;
  if (kind === "list") return 10;
  return 0;
}

export function emptyData(kind: BotKind): BotNodeData {
  const meta = KIND_META[kind];
  const defaults: Record<BotKind, Partial<BotNodeData>> = {
    start: { title: "Inicio", text: "" },
    message: {
      title: "Texto",
      text: "Hola, gracias por escribirnos a WhatsApp.",
    },
    question: {
      title: "Botones",
      text: "Elige una opción",
      options: [
        { id: uidOption(), label: "Opción A" },
        { id: uidOption(), label: "Opción B" },
      ],
    },
    list: {
      title: "Lista",
      text: "Toca para ver el menú",
      listButton: "Ver opciones",
      options: [
        { id: uidOption(), label: "Opción 1" },
        { id: uidOption(), label: "Opción 2" },
        { id: uidOption(), label: "Opción 3" },
      ],
    },
    input: {
      title: "Dato",
      text: "¿Cómo te llamas?",
      variable: "nombre",
    },
    media: {
      title: "Imagen",
      text: "Así se ve el producto.",
    },
    ai: {
      title: "IA",
      text: "",
      aiPrompt:
        "Eres un bot de WhatsApp Business, breve y amable. Responde en 1 o 2 frases, sin markdown.",
    },
    end: {
      title: "Fin",
      text: "Gracias por escribirnos. Aquí estamos si nos necesitas.",
    },
  };
  return {
    kind,
    title: meta.label,
    text: "",
    options: [],
    variable: "",
    aiPrompt: "",
    listButton: "",
    ...defaults[kind],
  };
}

export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{([a-zA-Z_][\w]*)\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}

export function hydrateSerialized(flow: SerializedFlow): FlowSnapshot {
  const nodes: BotNode[] = flow.nodes.map((n) => ({
    id: n.id,
    type: "bot",
    position: { x: 0, y: 0 },
    deletable: n.kind !== "start",
    data: {
      kind: n.kind,
      title: n.title,
      text: n.text,
      options: n.options ?? [],
      variable: n.variable ?? "",
      aiPrompt: n.aiPrompt ?? "",
      listButton: n.listButton ?? "",
    },
  }));
  const edges: BotEdge[] = flow.edges.map((e) => ({
    id: `e_${e.source}_${e.sourceHandle ?? "out"}_${e.target}`,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    type: "smoothstep",
  }));
  return { name: flow.name, nodes, edges, identity: flow.identity };
}

export const DEFAULT_IDENTITY: BotIdentity = {
  business: "Café Vía",
  about: "Cuenta de negocio",
};
