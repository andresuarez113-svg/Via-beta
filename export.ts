import type { BotEdge, BotIdentity, BotNode } from "./types";

export function exportWhatsAppJson(input: {
  name: string;
  identity: BotIdentity;
  nodes: BotNode[];
  edges: BotEdge[];
}) {
  const payload = {
    channel: "whatsapp",
    business: input.identity.business,
    about: input.identity.about,
    flowName: input.name,
    messages: input.nodes.map((n) => ({
      id: n.id,
      type:
        n.data.kind === "question"
          ? "interactive.button"
          : n.data.kind === "list"
            ? "interactive.list"
            : n.data.kind === "media"
              ? "image"
              : n.data.kind === "input"
                ? "text.wait_user"
                : n.data.kind === "ai"
                  ? "text.ai"
                  : n.data.kind === "end"
                    ? "text.end"
                    : n.data.kind === "start"
                      ? "start"
                      : "text",
      text: n.data.text,
      header: n.data.title,
      listButton: n.data.listButton || undefined,
      variable: n.data.variable || undefined,
      aiPrompt: n.data.aiPrompt || undefined,
      buttons: n.data.options.map((o) => ({
        id: o.id,
        title: o.label.slice(0, 20),
        next: input.edges.find(
          (e) => e.source === n.id && e.sourceHandle === o.id,
        )?.target,
      })),
      next: input.edges.find((e) => e.source === n.id && !e.sourceHandle)
        ?.target,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${input.name.replace(/\s+/g, "-").toLowerCase()}-whatsapp.json`;
  a.click();
  URL.revokeObjectURL(url);
}
