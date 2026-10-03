import { useCallback, useEffect, useRef, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlowStore } from "@/lib/flow/store";
import type { BotKind } from "@/lib/flow/types";
import { BotNodeCard } from "./bot-node";

const nodeTypes: NodeTypes = { bot: BotNodeCard };

function CanvasInner() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNodeAt = useFlowStore((s) => s.addNodeAt);
  const setSelectedId = useFlowStore((s) => s.setSelectedId);
  const persistNow = useFlowStore((s) => s.persistNow);
  const revision = useFlowStore((s) => s.revision);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const ready = useNodesInitialized();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 280 });
    }, 40);
    return () => window.clearTimeout(t);
  }, [ready, revision, fitView]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        void fitView({ padding: 0.18, duration: 180 });
      }, 80);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [fitView]);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/via-kind") as BotKind;
      if (!kind) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNodeAt(kind, position);
    },
    [addNodeAt, screenToFlowPosition],
  );

  return (
    <div ref={wrapperRef} className="via-canvas h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onNodeDragStop={() => persistNow()}
        onSelectionChange={({ nodes: sel }) => {
          setSelectedId(sel[0]?.id ?? null);
        }}
        onPaneClick={() => setSelectedId(null)}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
        minZoom={0.25}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--color-sage)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="var(--color-forest)"
          maskColor="color-mix(in oklab, var(--color-bg) 72%, transparent)"
        />
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
