'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  buildPersonaGraph,
  edgeColor,
  extractName,
  provinceColor,
  type EdgeType,
  type GraphNode,
  type Persona,
  type SupportedLang,
} from '../lib/persona-graph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface FGNode extends GraphNode {
  x?: number;
  y?: number;
  __color: string;
  __label: string;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
  type: EdgeType;
  weight: number;
}

interface Props {
  personas: Persona[];
  lang: SupportedLang;
  width: number;
  height: number;
  /** Number of nodes currently visible (for staged reveal). Undefined = show all. */
  revealCount?: number;
  /** Whether to render edge type labels along links. */
  showEdgeLabels?: boolean;
}

const EDGE_LABEL_KO: Record<EdgeType, string> = {
  SAME_REGION_AS: '같은 지역',
  SAME_SECTOR_AS: '같은 직업군',
  SAME_GENERATION_AS: '같은 세대',
};
const EDGE_LABEL_ZH: Record<EdgeType, string> = {
  SAME_REGION_AS: '同地区',
  SAME_SECTOR_AS: '同行业',
  SAME_GENERATION_AS: '同年代',
};
const EDGE_LABEL_EN: Record<EdgeType, string> = {
  SAME_REGION_AS: 'Same region',
  SAME_SECTOR_AS: 'Same sector',
  SAME_GENERATION_AS: 'Same generation',
};

function edgeLabel(type: EdgeType, lang: SupportedLang): string {
  if (lang === 'ko') return EDGE_LABEL_KO[type];
  if (lang === 'zh') return EDGE_LABEL_ZH[type];
  return EDGE_LABEL_EN[type];
}

export default function PersonaGraph({
  personas,
  lang,
  width,
  height,
  revealCount,
  showEdgeLabels = false,
}: Props) {
  // react-force-graph-2d's ref type is awkward through next/dynamic; allow any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [hovered, setHovered] = useState<FGNode | null>(null);

  const fullGraph = useMemo(() => buildPersonaGraph(personas, lang), [personas, lang]);

  const visible = useMemo(() => {
    const total = fullGraph.nodes.length;
    const limit =
      revealCount === undefined ? total : Math.min(Math.max(0, revealCount), total);

    const visibleIds = new Set(fullGraph.nodes.slice(0, limit).map((n) => n.id));

    const nodes: FGNode[] = fullGraph.nodes
      .filter((n) => visibleIds.has(n.id))
      .map((n) => ({
        ...n,
        __color: provinceColor(n.province, n.generation),
        __label: extractName(n.persona, lang),
      }));

    const links: FGLink[] = fullGraph.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, type: e.type, weight: e.weight }));

    return { nodes, links };
  }, [fullGraph, lang, revealCount]);

  useEffect(() => {
    const t = setTimeout(() => fgRef.current?.zoomToFit?.(400, 60), 700);
    return () => clearTimeout(t);
  }, [visible.nodes.length]);

  const total = fullGraph.nodes.length;

  return (
    <div className="relative" style={{ width, height }}>
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={visible}
        nodeId="id"
        nodeRelSize={5}
        nodeColor={(n: object) => (n as FGNode).__color}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(n: object, ctx: CanvasRenderingContext2D, scale: number) => {
          const node = n as FGNode;
          if (scale < 1.4 || node.x === undefined || node.y === undefined) return;
          ctx.font = `${10 / scale}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = 'rgba(15,23,42,0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.__label, node.x, node.y + 7 / scale);
        }}
        linkColor={(e: object) => edgeColor((e as FGLink).type)}
        linkWidth={(e: object) => (e as FGLink).weight * 0.9}
        linkCanvasObjectMode={() => (showEdgeLabels ? 'after' : undefined)}
        linkCanvasObject={(e: object, ctx: CanvasRenderingContext2D, scale: number) => {
          if (!showEdgeLabels || scale < 1.6) return;
          const link = e as FGLink;
          const src = link.source as FGNode;
          const tgt = link.target as FGNode;
          if (
            src?.x === undefined ||
            src?.y === undefined ||
            tgt?.x === undefined ||
            tgt?.y === undefined
          ) {
            return;
          }
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          ctx.font = `${8 / scale}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = 'rgba(71,85,105,0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(edgeLabel(link.type, lang), mx, my);
        }}
        cooldownTicks={140}
        d3VelocityDecay={0.35}
        onNodeHover={(n) => setHovered((n as FGNode | null) ?? null)}
        backgroundColor="rgba(0,0,0,0)"
      />

      {hovered && <PersonaHoverCard node={hovered} lang={lang} />}

      <div className="pointer-events-none absolute bottom-2 left-2 text-[11px] text-slate-500/80">
        {visible.nodes.length} / {total} nodes · {visible.links.length} edges
      </div>
    </div>
  );
}

function PersonaHoverCard({ node, lang }: { node: FGNode; lang: SupportedLang }) {
  const p = node.persona;
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 max-w-[320px] rounded-lg border border-slate-200/80 bg-white/95 p-3 text-[12px] shadow-md backdrop-blur">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: node.__color }}
          aria-hidden
        />
        <div className="font-semibold text-slate-800">{extractName(p, lang)}</div>
        <div className="text-slate-500">
          {p.age} · {p.sex}
        </div>
      </div>
      <div className="mt-1 text-slate-600">{p.occupation}</div>
      <div className="text-[11px] text-slate-500">
        {p.district} · {p.generation}
      </div>
      <div className="mt-2 leading-snug text-slate-700">{p.persona}</div>
      {p.interests?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {p.interests.slice(0, 5).map((i) => (
            <span
              key={i}
              className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-600"
            >
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
