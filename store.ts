import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { uid } from "@/lib/utils";
import { DEFAULT_FLOW, TEMPLATES } from "./templates";
import { layoutGraph } from "./layout";
import { branchesFrom } from "./engine";
import {
  DEFAULT_IDENTITY,
  emptyData,
  hydrateSerialized,
  optionLimit,
  uidOption,
  type BotEdge,
  type BotIdentity,
  type BotKind,
  type BotNode,
  type BotNodeData,
  type FlowSnapshot,
  type TrainingExample,
  type LearningCandidate,
  type SerializedFlow,
} from "./types";

const STORAGE_KEY = "via-flow-v2";
const LEGACY_KEY = "via-flow-v1";

function cloneFlow(flow: FlowSnapshot): FlowSnapshot {
  return {
    name: flow.name,
    identity: flow.identity
      ? { ...flow.identity }
      : { ...DEFAULT_IDENTITY, business: flow.name },
    nodes: flow.nodes.map((n) => ({
      ...n,
      position: { ...n.position },
      data: {
        kind: n.data.kind,
        title: n.data.title,
        text: n.data.text,
        options: (n.data.options ?? []).map((o) => ({ ...o })),
        variable: n.data.variable ?? "",
        aiPrompt: n.data.aiPrompt ?? "",
        listButton: n.data.listButton ?? "",
      },
    })),
    edges: flow.edges.map((e) => ({ ...e })),
    trainingEnabled: flow.trainingEnabled ?? true,
    trainingExamples: (flow.trainingExamples ?? []).map((e) => ({ ...e })),
    learningCandidates: (flow.learningCandidates ?? []).map((e) => ({ ...e })),
  };
}

function makeNode(
  kind: BotKind,
  position: { x: number; y: number },
): BotNode {
  return {
    id: uid("n"),
    type: "bot",
    position,
    data: emptyData(kind),
    deletable: kind !== "start",
  };
}

export type FlowState = {
  name: string;
  identity: BotIdentity;
  nodes: BotNode[];
  edges: BotEdge[];
  trainingEnabled: boolean;
  trainingExamples: TrainingExample[];
  learningCandidates: LearningCandidate[];
  selectedId: string | null;
  activeNodeId: string | null;
  hydrated: boolean;
  revision: number;
  hydrate: () => void;
  persistNow: () => void;
  setName: (name: string) => void;
  setIdentity: (patch: Partial<BotIdentity>) => void;
  setSelectedId: (id: string | null) => void;
  setActiveNodeId: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<BotNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<BotEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  connectNodes: (sourceId: string, targetId: string | null, sourceHandle?: string) => void;
  addNodeAt: (kind: BotKind, position: { x: number; y: number }) => string;
  duplicateNode: (id: string) => void;
  updateNodeData: (id: string, patch: Partial<BotNodeData>) => void;
  addOption: (id: string) => void;
  removeOption: (nodeId: string, optionId: string) => void;
  loadSnapshot: (flow: FlowSnapshot) => void;
  loadTemplate: (id: string) => void;
  resetBlank: () => void;
  setTrainingEnabled: (enabled: boolean) => void;
  addTrainingExample: (user: string, answer: string) => void;
  removeTrainingExample: (id: string) => void;
  addLearningCandidate: (user: string, botAnswer: string) => void;
  dismissLearningCandidate: (id: string) => void;
  teachLearningCandidate: (id: string, answer: string) => void;
};

function save(s: Pick<FlowState, "name" | "nodes" | "edges" | "identity" | "trainingEnabled" | "trainingExamples">) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: s.name,
        identity: s.identity,
        nodes: s.nodes,
        edges: s.edges,
        trainingEnabled: s.trainingEnabled,
        trainingExamples: s.trainingExamples,
        learningCandidates: s.learningCandidates,
      }),
    );
  } catch {
    /* ignore quota */
  }
}

const seed = cloneFlow(DEFAULT_FLOW);

export const useFlowStore = create<FlowState>((set, get) => ({
  name: seed.name,
  identity: seed.identity ?? DEFAULT_IDENTITY,
  nodes: seed.nodes,
  edges: seed.edges,
  trainingEnabled: true,
  trainingExamples: [],
  learningCandidates: [],
  selectedId: null,
  activeNodeId: null,
  hydrated: false,
  revision: 0,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FlowSnapshot;
        if (parsed?.nodes?.length) {
          const cloned = cloneFlow(parsed);
          set({
            name: cloned.name,
            identity: cloned.identity ?? DEFAULT_IDENTITY,
            nodes: cloned.nodes,
            edges: cloned.edges,
            trainingEnabled: cloned.trainingEnabled ?? true,
            trainingExamples: cloned.trainingExamples ?? [],
            learningCandidates: cloned.learningCandidates ?? [],
            hydrated: true,
            revision: get().revision + 1,
          });
          return;
        }
      }
    } catch {
      /* keep default */
    }
    set({ hydrated: true, revision: get().revision + 1 });
  },

  persistNow: () => save(get()),

  setName: (name) => {
    set({ name });
    save(get());
  },

  setIdentity: (patch) => {
    set({ identity: { ...get().identity, ...patch } });
    save(get());
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setActiveNodeId: (id) => set({ activeNodeId: id }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as BotNode[] });
    if (changes.some((c) => c.type === "remove")) {
      const selectedId = get().selectedId;
      if (selectedId && !get().nodes.some((n) => n.id === selectedId)) {
        set({ selectedId: null });
      }
      save(get());
    }
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) as BotEdge[] });
    if (changes.some((c) => c.type === "remove" || c.type === "add")) save(get());
  },

  connectNodes: (sourceId, targetId, sourceHandle) => {
    const sourceNode = get().nodes.find((n) => n.id === sourceId);
    if (!sourceNode || sourceNode.data.kind === "end") return;
    if (targetId === sourceId || targetId === "start") return;

    const currentEdges = get().edges.filter(
      (e) => !(e.source === sourceId && (e.sourceHandle ?? undefined) === (sourceHandle ?? undefined)),
    );

    if (!targetId) {
      set({ edges: currentEdges });
      save(get());
      return;
    }

    const targetNode = get().nodes.find((n) => n.id === targetId);
    if (!targetNode) return;
    if (branchesFrom(sourceNode.data.kind) && !sourceHandle) return;

    const optionLabel = sourceNode.data.options.find(
      (o) => o.id === sourceHandle,
    )?.label;

    set({
      edges: addEdge(
        {
          id: `e_${sourceId}_${sourceHandle ?? "out"}_${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle,
          type: "smoothstep",
          label: optionLabel,
        },
        currentEdges,
      ),
    });
    save(get());
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    get().connectNodes(connection.source, connection.target, connection.sourceHandle ?? undefined);
  },

  addNodeAt: (kind, position) => {
    let nextKind = kind;
    if (nextKind === "start" && get().nodes.some((n) => n.data.kind === "start")) {
      nextKind = "message";
    }
    const node = makeNode(nextKind, position);
    set({ nodes: get().nodes.concat(node), selectedId: node.id });
    save(get());
    return node.id;
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node || node.data.kind === "start") return;
    const copy: BotNode = {
      ...node,
      id: uid("n"),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: true,
      data: {
        ...node.data,
        title: `${node.data.title} copia`,
        options: node.data.options.map((o) => ({
          id: uidOption(),
          label: o.label,
        })),
      },
    };
    set({
      nodes: get().nodes.concat(copy),
      selectedId: copy.id,
    });
    save(get());
  },

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    });
    save(get());
  },

  addOption: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;
    const max = optionLimit(node.data.kind);
    if (!max || node.data.options.length >= max) return;
    const option = {
      id: uidOption(),
      label: `Opción ${node.data.options.length + 1}`,
    };
    get().updateNodeData(id, { options: [...node.data.options, option] });
  },

  removeOption: (nodeId, optionId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    get().updateNodeData(nodeId, {
      options: node.data.options.filter((o) => o.id !== optionId),
    });
    set({
      edges: get().edges.filter(
        (e) => !(e.source === nodeId && e.sourceHandle === optionId),
      ),
    });
    save(get());
  },

  loadSnapshot: (flow) => {
    const cloned = cloneFlow(flow);
    set({
      name: cloned.name,
      identity: cloned.identity ?? {
        business: cloned.name,
        about: "Cuenta de negocio",
      },
      nodes: cloned.nodes,
      edges: cloned.edges,
      trainingEnabled: cloned.trainingEnabled ?? true,
      trainingExamples: cloned.trainingExamples ?? [],
      learningCandidates: cloned.learningCandidates ?? [],
      selectedId: null,
      activeNodeId: null,
      revision: get().revision + 1,
    });
    save(get());
  },

  loadTemplate: (id) => {
    const found = TEMPLATES.find((t) => t.id === id);
    if (found) get().loadSnapshot(found.flow);
  },

  resetBlank: () => {
    const start = makeNode("start", { x: 80, y: 200 });
    start.id = "start";
    start.deletable = false;
    const first = makeNode("message", { x: 340, y: 188 });
    const end = makeNode("end", { x: 620, y: 200 });
    set({
      name: "Mi bot de WhatsApp",
      identity: {
        business: "Mi negocio",
        about: "Cuenta de negocio",
      },
      nodes: [start, first, end],
      edges: [],
      trainingEnabled: true,
      trainingExamples: [],
      learningCandidates: [],
      selectedId: first.id,
      activeNodeId: null,
      revision: get().revision + 1,
    });
    save(get());
  },

  setTrainingEnabled: (enabled) => {
    set({ trainingEnabled: enabled });
    save(get());
  },

  addTrainingExample: (user, answer) => {
    const cleanUser = user.trim().slice(0, 500);
    const cleanAnswer = answer.trim().slice(0, 700);
    if (!cleanUser || !cleanAnswer) return;
    const example: TrainingExample = {
      id: uid("t"),
      user: cleanUser,
      answer: cleanAnswer,
      createdAt: Date.now(),
    };
    set({ trainingExamples: [example, ...get().trainingExamples].slice(0, 100) });
    save(get());
  },

  removeTrainingExample: (id) => {
    set({ trainingExamples: get().trainingExamples.filter((e) => e.id !== id) });
    save(get());
  },

  addLearningCandidate: (user, botAnswer) => {
    const cleanUser = user.trim().slice(0, 500);
    const cleanAnswer = botAnswer.trim().slice(0, 700);
    if (!cleanUser) return;
    const candidate: LearningCandidate = {
      id: uid("lc"),
      user: cleanUser,
      botAnswer: cleanAnswer,
      createdAt: Date.now(),
    };
    const exists = get().learningCandidates.some((c) => c.user.toLowerCase() === cleanUser.toLowerCase());
    if (exists) return;
    set({ learningCandidates: [candidate, ...get().learningCandidates].slice(0, 50) });
    save(get());
  },

  dismissLearningCandidate: (id) => {
    set({ learningCandidates: get().learningCandidates.filter((c) => c.id !== id) });
    save(get());
  },

  teachLearningCandidate: (id, answer) => {
    const candidate = get().learningCandidates.find((c) => c.id === id);
    const cleanAnswer = answer.trim().slice(0, 700);
    if (!candidate || !cleanAnswer) return;
    const example: TrainingExample = {
      id: uid("t"),
      user: candidate.user,
      answer: cleanAnswer,
      createdAt: Date.now(),
    };
    set({
      trainingExamples: [example, ...get().trainingExamples].slice(0, 100),
      learningCandidates: get().learningCandidates.filter((c) => c.id !== id),
    });
    save(get());
  },
}));

export function applyGeneratedFlow(flow: SerializedFlow) {
  const snapshot = hydrateSerialized(flow);
  const laid = layoutGraph(snapshot.nodes, snapshot.edges);
  useFlowStore.getState().loadSnapshot({ ...snapshot, nodes: laid });
}
