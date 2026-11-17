import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { line } from 'd3-shape';
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
  // Build side-shade polygons connecting front/bottom edges to extruded offset
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
  bottomInsetPx = 180,
}: CampusMapSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomK, setZoomK] = useState(1);
  const [routeDrawn, setRouteDrawn] = useState(false);

  const pathGen = useMemo(
    () =>
      line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1]),
    []
  );

  // Outdoor edges only for the 2D campus base
  const outdoorEdges = useMemo(
    () =>
      GRAPH_EDGES.filter((e) => {
        const a = nodeMap.get(e.a);
        const b = nodeMap.get(e.b);
        return a && b && a.floor === 0 && b.floor === 0;
      }),
    []
  );

  // Build route segments per step (outdoor / ground floor)
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
        return {
          idx,
          d: pathGen(coords) ?? '',
          coords,
        };
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

  // Setup d3-zoom
  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const zb = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 4.5])
      .on('zoom', (event) => {
        select(gEl).attr('transform', event.transform.toString());
        setZoomK(event.transform.k);
      });

    zoomBehaviorRef.current = zb;
    const svgSel = select(svgEl);
    svgSel.call(zb);

    // Initial fit
    const rect = svgEl.getBoundingClientRect();
    const w = rect.width || 390;
    const h = rect.height || 520;
    const initialScale = Math.min(w / 860, (h - bottomInsetPx) / 420, 1.15);
    const tx = w / 2 - 340 * initialScale;
    const ty = (h - bottomInsetPx) / 2 - 15 * initialScale;
    svgSel.call(zb.transform, zoomIdentity.translate(tx, ty).scale(initialScale));

    return () => {
      svgSel.on('.zoom', null);
    };
  }, [bottomInsetPx]);

  // Camera fly to fit route + route draw animation
  useEffect(() => {
    setRouteDrawn(false);
    const raf = requestAnimationFrame(() => setRouteDrawn(true));

    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb || !route) {
      return () => cancelAnimationFrame(raf);
    }

    const pts = route.nodes
      .map((id) => nodeMap.get(id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n && n.floor === 0));
    if (pts.length === 0) return () => cancelAnimationFrame(raf);

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs) - 50;
    const maxX = Math.max(...xs) + 50;
    const minY = Math.min(...ys) - 50;
    const maxY = Math.max(...ys) + 50;

    const rect = svgEl.getBoundingClientRect();
    const w = rect.width || 390;
    const availH = Math.max(200, (rect.height || 560) - bottomInsetPx);
    const scale = Math.min(w / (maxX - minX), availH / (maxY - minY), 2.4);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = w / 2 - cx * scale;
    const ty = availH / 2 - cy * scale;

    const svgSel = select(svgEl);
    svgSel.call(zb.transform, zoomIdentity.translate(tx, ty).scale(scale));

    return () => cancelAnimationFrame(raf);
  }, [route, bottomInsetPx]);

  const youNode = nodeMap.get(youNodeId) ?? nodeMap.get('gate.main')!;

  return (
    <svg
      ref={svgRef}
      className="w-full h-full touch-none select-none bg-paper"
      role="img"
      aria-label="LPU Campus Vector Map"
    >
      <defs>
        <pattern id="campus-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="var(--ink)"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <g ref={gRef}>
        {/* Metric campus grid */}
        <rect x="-400" y="-400" width="1600" height="1100" fill="url(#campus-grid)" />

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
                stroke={edge.verified ? 'var(--sandstone)' : 'var(--ink)'}
                strokeOpacity={edge.verified ? 0.9 : 0.25}
                strokeWidth={edge.verified ? 7 : 4}
                strokeDasharray={edge.verified ? undefined : '6 6'}
                strokeLinecap="square"
              />
            );
          })}
        </g>

        {/* Central Fountain landmark ring */}
        <circle
          cx={280}
          cy={40}
          r={16}
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth={1.5}
        />
        <circle cx={280} cy={40} r={6} fill="var(--sandstone)" stroke="var(--ink)" strokeWidth={1} />

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
                {/* Extruded side shade */}
                <path
                  d={extrudePolygon(b.points, dx, dy)}
                  fill="var(--ink)"
                  fillOpacity={0.22}
                  stroke="var(--ink)"
                  strokeWidth={1}
                />
                {/* Roof footprint */}
                <polygon
                  points={polyPoints}
                  fill={isB34 ? 'var(--brick)' : 'var(--sandstone)'}
                  stroke={isSelected ? 'var(--signal)' : 'var(--ink)'}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                {/* Night window dots layer (visible in dark mode via CSS) */}
                <g className="opacity-0 dark:opacity-100 transition-opacity duration-300">
                  <circle cx={cx - 12} cy={cy + 8} r={1.8} fill="var(--signal)" />
                  <circle cx={cx} cy={cy + 8} r={1.8} fill="var(--signal)" />
                  <circle cx={cx + 12} cy={cy + 8} r={1.8} fill="var(--signal)" />
                </g>
                {/* Label LOD by zoom level */}
                {(zoomK > 0.65 || isB34 || b.kind === 'gate') && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    className="font-block-numeral pointer-events-none"
                    fontSize={isB34 ? 15 : 10}
                    fill={isB34 ? 'var(--paper)' : 'var(--ink)'}
                  >
                    {b.block ? `B${b.block}` : lang === 'hi' ? b.hiName : b.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Full route draw-in underlayer */}
        {fullOutdoorRouteD && (
          <path
            d={fullOutdoorRouteD}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.25}
          />
        )}

        {/* Active vs inactive route step segments */}
        {stepPaths.map((seg) => {
          const isActive = seg.idx === activeStepIndex;
          return (
            <path
              key={seg.idx}
              d={seg.d}
              fill="none"
              stroke="var(--signal)"
              strokeWidth={isActive ? 6 : 4}
              strokeOpacity={isActive ? 1 : 0.3}
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

        {/* Flowing chevron marker along full outdoor route */}
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

        {/* You marker pulsing at 0.6 Hz */}
        <g transform={`translate(${youNode.x}, ${youNode.y})`}>
          <circle r={11} fill="var(--signal)" className="you-pulse" />
          <circle r={6} fill="var(--ink)" stroke="var(--signal)" strokeWidth={2.5} />
        </g>
      </g>
    </svg>
  );
}
