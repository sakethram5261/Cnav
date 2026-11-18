import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, GlobeHemisphereEast, MapTrifold } from '@phosphor-icons/react';
import { GRAPH_NODES, PLACES } from '../data/campusGraph';
import { detectCurrentBlock } from '../lib/geo';
import type { ComputedRoute, Lang, Place } from '../types/wayfinding';

interface LpuLeafletMapProps {
  route?: ComputedRoute | null;
  activeStepIndex?: number;
  youNodeId?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: Place) => void;
  lang: Lang;
}

const nodeMap = new Map(GRAPH_NODES.map((n) => [n.id, n]));
const LPU_CENTER: [number, number] = [31.2545, 75.7046];

// Hand-traced outdoor spine from Main Gate 1 to the academic quad, following the
// visible road / covered-walkway corridor in the supplied LPU site plan. This is
// deliberately separate from building-door nodes so a route never cuts through a block.
const CAMPUS_SPINE: [number, number][] = [
  [31.2606374, 75.7067638],
  [31.26012, 75.70662],
  [31.25945, 75.70643],
  [31.2587, 75.70618],
  [31.2579, 75.70608],
  [31.25705, 75.70588],
  [31.25615, 75.70570],
  [31.25525, 75.70555],
  [31.25442, 75.70535],
  [31.25362, 75.70517],
  [31.25282, 75.70495],
  [31.25215, 75.70470],
  [31.25160, 75.70455],
  [31.2512938, 75.7047603],
];

function formatPinLabel(p: Place): string {
  if (p.id === 'main-gate') return 'G1';
  if (p.id === 'gs-2') return 'G2';
  if (p.block) return `B${p.block}`;
  return p.names[0].slice(0, 7);
}

function getPlanRoute(route: ComputedRoute): [number, number][] {
  const start = nodeMap.get(route.nodes[0]);
  const end = nodeMap.get(route.nodes[route.nodes.length - 1]);
  if (!start?.lat || !start.lng || !end?.lat || !end.lng) return [];
  const startPoint: [number, number] = [start.lat, start.lng];
  const endPoint: [number, number] = [end.lat, end.lng];
  return [startPoint, ...CAMPUS_SPINE.slice(1, -1), endPoint];
}

export function LpuLeafletMap({
  route,
  activeStepIndex = 0,
  youNodeId = 'gate.main',
  selectedPlaceId,
  onSelectPlace,
  lang,
}: LpuLeafletMapProps) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);

  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: LPU_CENTER,
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    routeLayerRef.current = routeLayer;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attr = satellite
      ? 'Tiles &copy; Esri'
      : '&copy; OpenStreetMap contributors';

    const layer = L.tileLayer(url, {
      maxZoom: 19,
      attribution: attr,
    }).addTo(map);

    tileLayerRef.current = layer;
  }, [satellite]);

  const mapPlaces = useMemo(
    () => PLACES.filter((p) => p.lat !== undefined && p.lng !== undefined && !p.room),
    []
  );

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const p of mapPlaces) {
      if (!p.lat || !p.lng) continue;
      const isSelected = p.id === selectedPlaceId;
      const isPrimary =
        p.block === 34 ||
        p.block === 36 ||
        p.category === 'gate' ||
        p.category === 'library' ||
        p.category === 'food';
      const label = formatPinLabel(p);

      const icon = L.divIcon({
        className: 'lpu-pin',
        html: `<div class="lpu-pin-badge ${isPrimary ? 'is-primary' : ''} ${
          isSelected ? 'is-selected' : ''
        }">${label}</div>`,
        iconSize: [0, 0],
        iconAnchor: [16, 12],
      });

      const marker = L.marker([p.lat, p.lng], { icon });
      marker.bindTooltip(lang === 'hi' && p.hiName ? p.hiName : p.names[0], {
        direction: 'top',
        offset: [0, -10],
      });
      marker.on('click', () => {
        onSelectPlace?.(p);
      });
      marker.addTo(layer);
    }
  }, [mapPlaces, selectedPlaceId, onSelectPlace, lang]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (route) {
      const fullCoords = getPlanRoute(route);

      if (fullCoords.length >= 2) {
        L.polyline(fullCoords, {
          color: '#14171A',
          weight: 8,
          opacity: 0.2,
        }).addTo(layer);

        L.polyline(fullCoords, {
          color: '#D9531E',
          weight: 5,
          opacity: 0.5,
        }).addTo(layer);

        // Keep the highlighted route on the same manually traced outdoor spine.
        // Indoor stair/lift steps stay in the instruction cards instead of being
        // drawn as a false outdoor segment.

        const bounds = L.latLngBounds(fullCoords);
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
      }
    }

    const you = nodeMap.get(youNodeId);
    if (you?.lat && you?.lng) {
      L.circleMarker([you.lat, you.lng], {
        radius: 8,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#2563EB',
        fillOpacity: 1,
      }).addTo(layer);
    }
  }, [route, activeStepIndex, youNodeId]);

  const handleLocateMe = async () => {
    const map = mapRef.current;
    if (!map) return;
    setLocating(true);
    const res = await detectCurrentBlock();
    setLocating(false);
    if (res.ok) {
      if (gpsMarkerRef.current) {
        map.removeLayer(gpsMarkerRef.current);
      }
      gpsMarkerRef.current = L.circleMarker([res.lat, res.lng], {
        radius: 9,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#16A34A',
        fillOpacity: 1,
      }).addTo(map);
      if (res.offCampus && res.node.lat && res.node.lng) {
        map.setView([res.node.lat, res.node.lng], 17);
      } else {
        map.setView([res.lat, res.lng], 17);
      }
    } else {
      map.setView(LPU_CENTER, 16);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapElRef} className="w-full h-full" />

      <div className="absolute top-3 left-14 z-[500] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer border"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
          }}
        >
          {satellite ? <MapTrifold size={15} weight="bold" /> : <GlobeHemisphereEast size={15} weight="bold" />}
          <span>{satellite ? 'Street Map' : 'Satellite'}</span>
        </button>

        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Locate me"
          className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer border"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
          }}
        >
          <Crosshair size={15} weight="bold" />
          <span>{locating ? 'Locating…' : 'Locate'}</span>
        </button>
      </div>
    </div>
  );
}
