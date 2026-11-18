import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { line } from 'd3-shape';
import { Crosshair, Minus, Plus } from '@phosphor-icons/react';
import {
  BUILDINGS,
  GRAPH_EDGES,
  GRAPH_NODES,
  PLACES,
} from '../data/campusGraph';
import type {
  BuildingFootprint,
  ComputedRoute,
  Lang,
  Place,
} from '../types/wayfinding';

interface CampusMapSvgProps {
  route?: ComputedRoute | null;
  activeStepIndex?: number;
  youNodeId?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: Place) => void;
  lang: Lang;
  bottomInsetPx?: number;
}

const nodeMap = new Map(GRAPH_NODES.map((n) => [n.id, n]));

function extrudePolygon(points: [number, number][], dx = 10, dy = 10): string {
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    parts.push(
      `M${x1},${y1} L${x2},${y2} L${x2 + dx},${y2 + dy} L${x1 + dx},${y1 + dy} Z`
    );
  }
  return parts.join(' ');
}

function buildingCenter(b: BuildingFootprint): [number, number] {
  const xs = b.points.map((p) => p[0]);
  const ys = b.points.map((p) => p[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ];
}

export function CampusMapSvg({
  route,
  activeStepIndex = 0,
  youNodeId = 'gate.main',
  selectedPlaceId,
  onSelectPlace,
  lang,
  bottomInsetPx = 0,
}: CampusMapSvgProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ width: 390, height: 500 });
  const [zoomK, setZoomK] = useState(0.75);
  const [routeDrawn, setRouteDrawn] = useState(false);

  const pathGen = useMemo(
    () =>
      line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1]),
    []
  );

  // Measure actual container size with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const outdoorEdges = useMemo(
    () =>
      GRAPH_EDGES.filter((e) => {
        const a = nodeMap.get(e.a);
        const b = nodeMap.get(e.b);
        return a && b && a.floor === 0 && b.floor === 0;
      }),
    []
  );

  const stepPaths = useMemo(() => {
    if (!route) return [];
    return route.steps
      .map((step, idx) => {
        const coords: [number, number][] = [];
        for (const nid of step.nodeIds) {
          const n = nodeMap.get(nid);
          if (n && n.floor === 0) coords.push([n.x, n.y]);
        }
        if (coords.length < 2) return null;
        return { idx, d: pathGen(coords) ?? '', coords };
      })
      .filter((x): x is { idx: number; d: string; coords: [number, number][] } => Boolean(x));
  }, [route, pathGen]);

  const fullOutdoorRouteD = useMemo(() => {
    if (!route) return '';
    const coords: [number, number][] = [];
    for (const nid of route.nodes) {
      const n = nodeMap.get(nid);
      if (n && n.floor === 0) {
        const last = coords[coords.length - 1];
        if (!last || last[0] !== n.x || last[1] !== n.y) {
          coords.push([n.x, n.y]);
        }
      }
    }
    return coords.length >= 2 ? pathGen(coords) ?? '' : '';
  }, [route, pathGen]);

  const fitView = useCallback(() => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;

    const w = size.width;
    const availH = Math.max(180, size.height - bottomInsetPx);

    if (route) {
      const pts = route.nodes
        .map((id) => nodeMap.get(id))
        .filter((n): n is NonNullable<typeof n> => Boolean(n && n.floor === 0));
      if (pts.length > 0) {
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const minX = Math.min(...xs) - 65;
        const maxX = Math.max(...xs) + 65;
        const minY = Math.min(...ys) - 65;
        const maxY = Math.max(...ys) + 65;
        const scale = Math.max(0.45, Math.min(w / (maxX - minX), availH / (maxY - minY), 2.2));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const tx = w / 2 - cx * scale;
        const ty = availH / 2 - cy * scale;
        select(svgEl).call(zb.transform, zoomIdentity.translate(tx, ty).scale(scale));
        return;
      }
    }

    const scale = Math.max(0.42, Math.min(w / 840, availH / 460, 1.25));
    const tx = w / 2 - 350 * scale;
    const ty = availH / 2 - 20 * scale;
    select(svgEl).call(zb.transform, zoomIdentity.translate(tx, ty).scale(scale));
  }, [size, bottomInsetPx, route]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const zb = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 4.5])
      .on('zoom', (event) => {
        select(gEl).attr('transform', event.transform.toString());
        setZoomK(event.transform.k);
      });

    zoomBehaviorRef.current = zb;
    const svgSel = select(svgEl);
    svgSel.call(zb);

    return () => {
      svgSel.on('.zoom', null);
    };
  }, []);

  useEffect(() => {
    setRouteDrawn(false);
    fitView();
    const raf = requestAnimationFrame(() => setRouteDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, [fitView]);

  const zoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    select(svgEl).call(zb.scaleBy, factor);
  };

  const youNode = nodeMap.get(youNodeId) ?? nodeMap.get('gate.main')!;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-paper">
      <svg
        ref={svgRef}
        className="w-full h-full touch-none select-none block"
        role="img"
        aria-label="LPU Campus Vector Map"
      >
        <defs>
          <pattern id="campus-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <g ref={gRef}>
          {/* Campus ground & metric grid */}
          <rect x="-500" y="-500" width="1800" height="1300" fill="url(#campus-grid)" />

          {/* Campus Lawns */}
          <rect
            x={95}
            y={-35}
            width={160}
            height={52}
            rx={4}
            fill="var(--moss)"
            fillOpacity={0.12}
            stroke="var(--moss)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <rect
            x={495}
            y={-30}
            width={95}
            height={90}
            rx={4}
            fill="var(--moss)"
            fillOpacity={0.12}
            stroke="var(--moss)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />

          {/* Main Campus Spine Road Underlay */}
          <path
            d="M 0,0 L 95,15 L 185,25 L 280,40 L 360,55 L 450,80 L 545,85 L 610,85"
            fill="none"
            stroke="var(--sandstone)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.55}
          />

          {/* Walkways */}
          <g>
            {outdoorEdges.map((edge) => {
              const a = nodeMap.get(edge.a)!;
              const b = nodeMap.get(edge.b)!;
              return (
                <line
                  key={`${edge.a}-${edge.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={edge.verified ? 'var(--ink)' : 'var(--ink)'}
                  strokeOpacity={edge.verified ? 0.35 : 0.2}
                  strokeWidth={edge.verified ? 4 : 3}
                  strokeDasharray={edge.verified ? undefined : '6 6'}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Central Fountain Plaza */}
          <circle
            cx={280}
            cy={40}
            r={22}
            fill="var(--sandstone)"
            fillOpacity={0.45}
            stroke="var(--ink)"
            strokeWidth={1}
          />
          <circle
            cx={280}
            cy={40}
            r={13}
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth={1.5}
          />
          <circle cx={280} cy={40} r={5} fill="var(--moss)" />

          {/* 2.5D Extruded Buildings */}
          <g>
            {BUILDINGS.map((b) => {
              const [cx, cy] = buildingCenter(b);
              const isB34 = b.block === 34;
              const isSelected = b.placeId && b.placeId === selectedPlaceId;
              const polyPoints = b.points.map((p) => p.join(',')).join(' ');
              const place = PLACES.find((p) => p.id === b.placeId);
              const dx = Math.round(b.heightM * 0.45);
              const dy = Math.round(b.heightM * 0.45);

              return (
                <g
                  key={b.id}
                  className={place && onSelectPlace ? 'cursor-pointer' : ''}
                  onClick={() => {
                    if (place && onSelectPlace) onSelectPlace(place);
                  }}
                >
                  <path
                    d={extrudePolygon(b.points, dx, dy)}
                    fill="var(--ink)"
                    fillOpacity={0.22}
                    stroke="var(--ink)"
                    strokeWidth={1}
                  />
                  <polygon
                    points={polyPoints}
                    fill={isB34 ? 'var(--brick)' : b.kind === 'gate' ? 'var(--ink)' : 'var(--sandstone)'}
                    stroke={isSelected ? 'var(--signal)' : 'var(--ink)'}
                    strokeWidth={isSelected ? 3.5 : 1.5}
                  />
                  {/* Night window dots */}
                  <g className="opacity-0 dark:opacity-100 transition-opacity duration-300">
                    <circle cx={cx - 14} cy={cy + 12} r={2} fill="var(--signal)" />
                    <circle cx={cx} cy={cy + 12} r={2} fill="var(--signal)" />
                    <circle cx={cx + 14} cy={cy + 12} r={2} fill="var(--signal)" />
                  </g>
                  {/* Smart Label LOD */}
                  {(zoomK >= 0.35 || isB34 || b.kind === 'gate') && (
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      className="font-block-numeral pointer-events-none"
                      fontSize={isB34 ? 17 : 11}
                      fill={isB34 || b.kind === 'gate' ? 'var(--paper)' : 'var(--ink)'}
                    >
                      {b.block ? `B${b.block}` : lang === 'hi' ? b.hiName : b.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Route underlayer */}
          {fullOutdoorRouteD && (
            <path
              d={fullOutdoorRouteD}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.28}
            />
          )}

          {/* Route step segments */}
          {stepPaths.map((seg) => {
            const isActive = seg.idx === activeStepIndex;
            return (
              <path
                key={seg.idx}
                d={seg.d}
                fill="none"
                stroke="var(--signal)"
                strokeWidth={isActive ? 7 : 4.5}
                strokeOpacity={isActive ? 1 : 0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={routeDrawn ? 0 : 100}
                style={{
                  transition: 'stroke-dashoffset 900ms cubic-bezier(.65,0,.35,1), stroke-opacity 280ms',
                }}
              />
            );
          })}

          {/* Flowing chevron along route */}
          {fullOutdoorRouteD && (
            <g>
              <path
                d="M -5,-4 L 3,0 L -5,4"
                fill="none"
                stroke="var(--ink)"
                strokeWidth={2.5}
                strokeLinecap="square"
              >
                <animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto" path={fullOutdoorRouteD} />
              </path>
            </g>
          )}

          {/* Pulsing You marker */}
          <g transform={`translate(${youNode.x}, ${youNode.y})`}>
            <circle r={12} fill="var(--signal)" className="you-pulse" />
            <circle r={6} fill="var(--ink)" stroke="var(--signal)" strokeWidth={2.5} />
          </g>
        </g>
      </svg>

      {/* Map zoom controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col border border-ink bg-paper shadow-[2px_2px_0_var(--ink)]">
        <button
          type="button"
          onClick={() => zoomBy(1.3)}
          aria-label="Zoom in"
          className="min-w-10 min-h-10 flex items-center justify-center border-b border-ink hover:bg-sandstone cursor-pointer"
        >
          <Plus size={16} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.75)}
          aria-label="Zoom out"
          className="min-w-10 min-h-10 flex items-center justify-center border-b border-ink hover:bg-sandstone cursor-pointer"
        >
          <Minus size={16} weight="bold" />
        </button>
        <button
          type="button"
          onClick={fitView}
          aria-label="Fit map"
          className="min-w-10 min-h-10 flex items-center justify-center hover:bg-sandstone cursor-pointer"
        >
          <Crosshair size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
