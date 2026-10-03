import type { BotEdge, BotNode } from "./types";

const COL = 280;
const ROW = 148;
const ORIGIN_X = 48;
const ORIGIN_Y = 64;

export function layoutGraph(nodes: BotNode[], edges: BotEdge[]): BotNode[] {
  if (nodes.length === 0) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    const list = outgoing.get(e.source) ?? [];
    list.push(e.target);
    outgoing.set(e.source, list);
  }

  const start =
    nodes.find((n) => n.data.kind === "start") ?? nodes[0];
  const level = new Map<string, number>();
  const order: string[] = [];
  const queue: string[] = [start.id];
  level.set(start.id, 0);

  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    const depth = level.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      if (!level.has(next) && byId.has(next)) {
        level.set(next, depth + 1);
        queue.push(next);
      }
    }
  }

  for (const n of nodes) {
    if (!level.has(n.id)) {
      level.set(n.id, 0);
      order.push(n.id);
    }
  }

  const buckets = new Map<number, string[]>();
  for (const id of order) {
    const d = level.get(id) ?? 0;
    const list = buckets.get(d) ?? [];
    list.push(id);
    buckets.set(d, list);
  }

  const positioned = new Map<string, { x: number; y: number }>();
  const depths = [...buckets.keys()].sort((a, b) => a - b);
  for (const d of depths) {
    const ids = buckets.get(d) ?? [];
    ids.forEach((id, i) => {
      const count = ids.length;
      const stackH = (count - 1) * ROW;
      const y = ORIGIN_Y + Math.max(0, 220 - stackH / 2) + i * ROW;
      positioned.set(id, { x: ORIGIN_X + d * COL, y });
    });
  }

  return nodes.map((n) => {
    const pos = positioned.get(n.id);
    if (!pos) return n;
    return { ...n, position: pos };
  });
}
