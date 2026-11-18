import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from '@phosphor-icons/react';
import { PLACES } from '../data/campusGraph';
import type { ComputedRoute, Lang, Place } from '../types/wayfinding';

interface LpuLeafletMapProps {
  route?: ComputedRoute | null;
  activeStepIndex?: number;
  youNodeId?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: Place) => void;
  lang: Lang;
}

const PLAN_WIDTH = 1527;
const PLAN_HEIGHT = 2048;
type Pixel = [number, number];

// Manually read from the supplied LPU site plan. Coordinates are x/y pixels from
// the top-left of that plan, so markers stay on the drawn building footprints.
const BLOCK_PIXELS: Record<number, Pixel> = {
  1: [483, 1877], 2: [515, 1794], 3: [539, 1716], 8: [322, 1480],
  13: [326, 1352], 14: [430, 1190], 15: [474, 1263], 18: [455, 1062],
  19: [646, 1053], 20: [846, 1025], 21: [850, 823], 22: [815, 936],
  25: [654, 871], 26: [603, 887], 27: [535, 918], 28: [473, 951],
  29: [409, 973], 30: [348, 1008], 31: [281, 1043], 32: [260, 969],
  33: [273, 900], 34: [347, 810], 35: [424, 884], 36: [370, 815],
  37: [454, 818], 38: [540, 820], 42: [673, 720], 43: [703, 585],
  45: [568, 514], 46: [603, 451], 47: [635, 350], 51: [287, 618],
  52: [220, 493], 53: [154, 373], 54: [111, 325], 55: [90, 276],
  56: [65, 225], 57: [48, 178], 58: [32, 126],
};

// Main road / walkway spine traced over the black circulation lines in the plan.
const CAMPUS_SPINE: Pixel[] = [
  [483, 1905], [488, 1818], [520, 1733], [503, 1648], [454, 1553],
  [432, 1450], [420, 1358], [409, 1268], [400, 1178], [392, 1086],
  [374, 1000], [350, 930], [323, 870], [347, 810],
];

const GATE_PIXEL: Pixel = [483, 1905];

function toLatLng([x, yTop]: Pixel): L.LatLngExpression {
  return [PLAN_HEIGHT - yTop, x];
}

function pixelForNode(route: ComputedRoute): Pixel | null {
  const last = route.nodes[route.nodes.length - 1] ?? '';
  if (last.includes('b34')) return BLOCK_PIXELS[34];
  if (last.includes('library')) return BLOCK_PIXELS[37];
  if (last.includes('food')) return BLOCK_PIXELS[15];
  const blockMatch = last.match(/b(\d+)\./);
  return blockMatch ? BLOCK_PIXELS[Number(blockMatch[1])] ?? null : null;
}

function formatPinLabel(p: Place): string {
  if (p.id === 'main-gate') return 'G1';
  if (p.id === 'gs-2') return 'G2';
  return p.block ? `B${p.block}` : p.names[0].slice(0, 6);
}

export function LpuLeafletMap({ route, selectedPlaceId, onSelectPlace, lang }: LpuLeafletMapProps) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routeRef = useRef<L.LayerGroup | null>(null);

  const planBounds = useMemo(() => L.latLngBounds([0, 0], [PLAN_HEIGHT, PLAN_WIDTH]), []);
  const mapPlaces = useMemo(
    () => PLACES.filter((p) => p.block && BLOCK_PIXELS[p.block] && !p.room),
    []
  );

  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, { crs: L.CRS.Simple, center: toLatLng([760, 1040]), zoom: -0.35, minZoom: -1.4, maxZoom: 2.2, zoomControl: false, attributionControl: false, maxBounds: planBounds, maxBoundsViscosity: 0.92 });
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.imageOverlay('/lpu-site-plan.webp', planBounds, { opacity: 1 }).addTo(map);
    const markers = L.layerGroup().addTo(map);
    const routes = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersRef.current = markers;
    routeRef.current = routes;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  }, [planBounds]);

  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();
    const all = [...mapPlaces];
    for (const p of all) {
      if (!p.block) continue;
      const pin = L.divIcon({ className: 'lpu-plan-pin', html: `<span class="lpu-plan-pin__badge ${p.id === selectedPlaceId ? 'is-selected' : ''}">${formatPinLabel(p)}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] });
      const marker = L.marker(toLatLng(BLOCK_PIXELS[p.block]), { icon: pin, title: lang === 'hi' && p.hiName ? p.hiName : p.names[0] });
      marker.bindTooltip(lang === 'hi' && p.hiName ? p.hiName : p.names[0], { direction: 'top', offset: [0, -8] });
      marker.on('click', () => onSelectPlace?.(p));
      marker.addTo(layer);
    }
    const gatePin = L.divIcon({ className: 'lpu-plan-pin', html: '<span class="lpu-plan-pin__badge is-gate">G1</span>', iconSize: [0, 0], iconAnchor: [0, 0] });
    L.marker(toLatLng(GATE_PIXEL), { icon: gatePin, title: 'Main Gate' }).addTo(layer);
  }, [mapPlaces, selectedPlaceId, onSelectPlace, lang]);

  useEffect(() => {
    const layer = routeRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!route) return;
    const destination = pixelForNode(route);
    if (!destination) return;
    const pixels = [...CAMPUS_SPINE.slice(0, -1), destination];
    L.polyline(pixels.map(toLatLng), { color: '#171313', weight: 13, opacity: 0.36, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
    L.polyline(pixels.map(toLatLng), { color: '#b51e2b', weight: 7, opacity: 1, dashArray: '17 10', lineCap: 'round', lineJoin: 'round' }).addTo(layer);
  }, [route]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapElRef} className="w-full h-full" />
      <div className="absolute top-3 left-14 z-[500] flex items-center gap-2">
        <div className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold border" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--gold)' }}><MapPin size={15} weight="fill" style={{ color: 'var(--accent)' }} /><span>Interactive site plan</span></div>
      </div>
      {route && <div className="absolute bottom-3 left-3 rounded-lg px-3 py-2 shadow-lg text-xs font-semibold border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--accent)' }}><span style={{ color: 'var(--accent)' }}>Dashed red route</span> follows the traced road/walkway spine from the official plan.</div>}
      <div className="absolute bottom-3 right-3 rounded-lg px-3 py-2 shadow-lg text-[10px] font-semibold border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>LPU site plan · interactive layer</div>
    </div>
  );
}
