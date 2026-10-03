import { interpolate, type BotEdge, type BotNode, type BotOption } from "./types";

export type StepKind = "say" | "ask-option" | "ask-text" | "ai" | "end" | "stuck";

export type EngineStep = {
  nodeId: string;
  kind: StepKind;
  text: string;
  options?: BotOption[];
  variable?: string;
  aiPrompt?: string;
  variant?: "text" | "buttons" | "list" | "media";
  listButton?: string;
};

export function findStart(nodes: BotNode[]): BotNode | undefined {
  return nodes.find((n) => n.data.kind === "start") ?? nodes[0];
}

export function outgoing(
  edges: BotEdge[],
  source: string,
  sourceHandle?: string | null,
): BotEdge[] {
  return edges.filter((e) => {
    if (e.source !== source) return false;
    if (sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  });
}

export function nodeById(
  nodes: BotNode[],
  id: string | null | undefined,
): BotNode | undefined {
  if (!id) return undefined;
  return nodes.find((n) => n.id === id);
}

export function follow(
  nodes: BotNode[],
  edges: BotEdge[],
  fromId: string,
  handle?: string,
): BotNode | undefined {
  const matches = handle
    ? outgoing(edges, fromId, handle)
    : outgoing(edges, fromId).filter((e) => !e.sourceHandle);
  const edge = matches[0] ?? outgoing(edges, fromId)[0];
  return nodeById(nodes, edge?.target);
}

export function describeNode(
  node: BotNode,
  vars: Record<string, string>,
): EngineStep {
  const text = interpolate(node.data.text, vars).trim();
  switch (node.data.kind) {
    case "start":
      return { nodeId: node.id, kind: "say", text: "", variant: "text" };
    case "message":
      return { nodeId: node.id, kind: "say", text, variant: "text" };
    case "media":
      return { nodeId: node.id, kind: "say", text, variant: "media" };
    case "question":
      return {
        nodeId: node.id,
        kind: "ask-option",
        text: text || "Elige una opción",
        options: node.data.options.filter((o) => o.label.trim()).slice(0, 3),
        variant: "buttons",
      };
    case "list":
      return {
        nodeId: node.id,
        kind: "ask-option",
        text: text || "Toca para ver el menú",
        options: node.data.options.filter((o) => o.label.trim()).slice(0, 10),
        variant: "list",
        listButton: node.data.listButton.trim() || "Ver opciones",
      };
    case "input":
      return {
        nodeId: node.id,
        kind: "ask-text",
        text: text || "Escríbeme tu respuesta",
        variable: node.data.variable.trim() || "dato",
        variant: "text",
      };
    case "ai":
      return {
        nodeId: node.id,
        kind: "ai",
        text,
        aiPrompt: node.data.aiPrompt,
        variant: "text",
      };
    case "end":
      return { nodeId: node.id, kind: "end", text, variant: "text" };
    default:
      return { nodeId: node.id, kind: "stuck", text: "" };
  }
}

export function nextAfterSay(
  nodes: BotNode[],
  edges: BotEdge[],
  node: BotNode,
): BotNode | undefined {
  if (node.data.kind === "end") return undefined;
  return follow(nodes, edges, node.id);
}

export function branchesFrom(kind: BotNode["data"]["kind"]): boolean {
  return kind === "question" || kind === "list";
}
