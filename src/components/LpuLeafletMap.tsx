import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, DownloadSimple, GlobeHemisphereEast, MapPin, MapTrifold, Trash } from '@phosphor-icons/react';
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

type CoordinateOverride = { lat: number; lng: number };
type CoordinateOverrides = Record<string, CoordinateOverride>;

const CALIBRATION_STORAGE_KEY = 'cnav-map-calibration-v1';
const nodeMap = new Map(GRAPH_NODES.map((n) => [n.id, n]));
const LPU_CENTER: [number, number] = [31.2545, 75.7046];

// Outdoor spine used by the original interactive map. In calibration mode, its
// visible graph nodes can be dragged and the resulting node coordinates are used.
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

function readCoordinateOverrides(): CoordinateOverrides {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CALIBRATION_STORAGE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        const item = value as Partial<CoordinateOverride>;
        return Number.isFinite(item.lat) && Number.isFinite(item.lng);
      })
    ) as CoordinateOverrides;
  } catch {
    return {};
  }
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
  const calibrationLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);

  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const [calibration, setCalibration] = useState<CoordinateOverrides>(() => readCoordinateOverrides());
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const calibrationEnabled = new URLSearchParams(window.location.search).get('calibrate') === '1';

  const getCoordinate = (id: string, fallback?: CoordinateOverride): CoordinateOverride | null => {
    const value = calibration[id] ?? fallback;
    return value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : null;
  };

  const persistCalibration = (next: CoordinateOverrides) => {
    setCalibration(next);
    window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(next));
  };

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
    const calibrationLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    routeLayerRef.current = routeLayer;
    calibrationLayerRef.current = calibrationLayer;

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
    tileLayerRef.current?.removeFrom(map);

    const url = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attr = satellite ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap contributors';
    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19, attribution: attr }).addTo(map);
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
      const coordinate = getCoordinate(p.node, p.lat !== undefined && p.lng !== undefined ? { lat: p.lat, lng: p.lng } : undefined);
      if (!coordinate) continue;
      const isSelected = p.id === selectedPlaceId;
      const isPrimary = p.block === 34 || p.block === 36 || p.category === 'gate' || p.category === 'library' || p.category === 'food';
      const icon = L.divIcon({
        className: 'lpu-pin',
        html: `<div class="lpu-pin-badge ${isPrimary ? 'is-primary' : ''} ${isSelected ? 'is-selected' : ''}">${formatPinLabel(p)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [16, 12],
      });

      const marker = L.marker([coordinate.lat, coordinate.lng], { icon, draggable: calibrationEnabled });
      if (calibrationEnabled) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          persistCalibration({ ...calibration, [p.node]: { lat: position.lat, lng: position.lng } });
        });
      }
      marker.bindTooltip(lang === 'hi' && p.hiName ? p.hiName : p.names[0], { direction: 'top', offset: [0, -10] });
      marker.on('click', () => onSelectPlace?.(p));
      marker.addTo(layer);
    }
  }, [mapPlaces, selectedPlaceId, onSelectPlace, lang, calibration, calibrationEnabled]);

  useEffect(() => {
    const layer = calibrationLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    if (!calibrationEnabled) return;

    for (const node of GRAPH_NODES.filter((item) => item.floor === 0)) {
      const coordinate = getCoordinate(node.id, node.lat !== undefined && node.lng !== undefined ? { lat: node.lat, lng: node.lng } : undefined);
      if (!coordinate) continue;
      const isPlaceNode = mapPlaces.some((place) => place.node === node.id);
      const handle = L.circleMarker([coordinate.lat, coordinate.lng], {
        radius: isPlaceNode ? 5 : 7,
        color: '#fff',
        weight: 2,
        fillColor: isPlaceNode ? '#7c3aed' : '#0f766e',
        fillOpacity: 0.95,
        bubblingMouseEvents: false,
      }).addTo(layer);
      handle.bindTooltip(`${node.id}${node.label?.en ? ` · ${node.label.en}` : ''}`, { direction: 'top', offset: [0, -8] });

      handle.on('mousedown', (event) => {
        L.DomEvent.stopPropagation(event);
        map.dragging.disable();
        const move = (moveEvent: L.LeafletMouseEvent) => handle.setLatLng(moveEvent.latlng);
        const finish = () => {
          map.off('mousemove', move);
          map.off('mouseup', finish);
          map.dragging.enable();
          const position = handle.getLatLng();
          persistCalibration({ ...calibration, [node.id]: { lat: position.lat, lng: position.lng } });
        };
        map.on('mousemove', move);
        map.on('mouseup', finish);
      });
    }

    CAMPUS_SPINE.forEach(([lat, lng], index) => {
      const id = `spine.${index}`;
      const coordinate = calibration[id] ?? { lat, lng };
      const handle = L.circleMarker([coordinate.lat, coordinate.lng], {
        radius: 4,
        color: '#fff',
        weight: 1.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.95,
        bubblingMouseEvents: false,
      }).addTo(layer);
      handle.bindTooltip(`Route spine ${index + 1}`, { direction: 'top', offset: [0, -7] });
      handle.on('mousedown', (event) => {
        L.DomEvent.stopPropagation(event);
        map.dragging.disable();
        const move = (moveEvent: L.LeafletMouseEvent) => handle.setLatLng(moveEvent.latlng);
        const finish = () => {
          map.off('mousemove', move);
          map.off('mouseup', finish);
          map.dragging.enable();
          const position = handle.getLatLng();
          persistCalibration({ ...calibration, [id]: { lat: position.lat, lng: position.lng } });
        };
        map.on('mousemove', move);
        map.on('mouseup', finish);
      });
    });
  }, [calibration, calibrationEnabled, mapPlaces]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (route) {
      const start = nodeMap.get(route.nodes[0]);
      const end = nodeMap.get(route.nodes[route.nodes.length - 1]);
      const startPoint = start ? getCoordinate(start.id, start.lat !== undefined && start.lng !== undefined ? { lat: start.lat, lng: start.lng } : undefined) : null;
      const endPoint = end ? getCoordinate(end.id, end.lat !== undefined && end.lng !== undefined ? { lat: end.lat, lng: end.lng } : undefined) : null;
      const spine = CAMPUS_SPINE.map(([lat, lng], index) => calibration[`spine.${index}`] ?? { lat, lng });
      const fullCoords: [number, number][] = startPoint && endPoint
        ? [[startPoint.lat, startPoint.lng], ...spine.slice(1, -1).map(({ lat, lng }) => [lat, lng] as [number, number]), [endPoint.lat, endPoint.lng]]
        : [];

      if (fullCoords.length >= 2) {
        L.polyline(fullCoords, { color: '#14171A', weight: 8, opacity: 0.2 }).addTo(layer);
        L.polyline(fullCoords, { color: '#D9531E', weight: 5, opacity: 0.5 }).addTo(layer);
        map.fitBounds(L.latLngBounds(fullCoords), { padding: [48, 48], maxZoom: 18 });
      }
    }

    const you = nodeMap.get(youNodeId);
    const youCoordinate = you ? getCoordinate(you.id, you.lat !== undefined && you.lng !== undefined ? { lat: you.lat, lng: you.lng } : undefined) : null;
    if (youCoordinate) {
      L.circleMarker([youCoordinate.lat, youCoordinate.lng], { radius: 8, color: '#FFFFFF', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(layer);
    }
  }, [route, activeStepIndex, youNodeId, calibration]);

  const handleLocateMe = async () => {
    const map = mapRef.current;
    if (!map) return;
    setLocating(true);
    const res = await detectCurrentBlock();
    setLocating(false);
    if (res.ok) {
      gpsMarkerRef.current?.removeFrom(map);
      gpsMarkerRef.current = L.circleMarker([res.lat, res.lng], { radius: 9, color: '#FFFFFF', weight: 3, fillColor: '#16A34A', fillOpacity: 1 }).addTo(map);
      if (res.offCampus && res.node.lat && res.node.lng) map.setView([res.node.lat, res.node.lng], 17);
      else map.setView([res.lat, res.lng], 17);
    } else {
      map.setView(LPU_CENTER, 16);
    }
  };

  const exportCalibration = () => {
    const blob = new Blob([JSON.stringify(calibration, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cnav-map-calibration.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapElRef} className="w-full h-full" />

      <div className="absolute top-3 left-14 z-[500] flex items-center gap-2">
        <button type="button" onClick={() => setSatellite((s) => !s)} className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer border" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          {satellite ? <MapTrifold size={15} weight="bold" /> : <GlobeHemisphereEast size={15} weight="bold" />}
          <span>{satellite ? 'Street Map' : 'Satellite'}</span>
        </button>

        {calibrationEnabled && (
          <button type="button" onClick={() => setCalibrationOpen((open) => !open)} className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer border" style={{ backgroundColor: calibrationOpen ? '#0f766e' : 'var(--surface)', color: calibrationOpen ? '#fff' : 'var(--text)', borderColor: calibrationOpen ? '#0f766e' : 'var(--border)' }}>
            <MapPin size={15} weight="bold" />
            <span>Calibrate</span>
          </button>
        )}

        <button type="button" onClick={handleLocateMe} aria-label="Locate me" className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer border" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          <Crosshair size={15} weight="bold" />
          <span>{locating ? 'Locating…' : 'Locate'}</span>
        </button>
      </div>

      {calibrationEnabled && calibrationOpen && (
        <div className="absolute top-14 left-14 z-[500] w-[min(360px,calc(100%-28px))] rounded-xl border shadow-xl p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: '#0f766e' }}>Developer calibration</p>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>Drag a colored handle to tune the route graph. Drag a block pin to tune its public marker. Changes are saved in this browser only.</p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold"><span>{Object.keys(calibration).length} saved points</span><span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>purple = place · teal = route</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={exportCalibration} className="h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer" style={{ backgroundColor: '#0f766e', color: '#fff' }}><DownloadSimple size={14} weight="bold" /> Export JSON</button>
            <button type="button" onClick={() => persistCalibration({})} className="h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}><Trash size={14} weight="bold" /> Reset</button>
          </div>
          <p className="mt-3 text-[11px] leading-4" style={{ color: 'var(--text-muted)' }}>When tuned, export the JSON and send it back. I’ll apply it to the source data and remove the <code>?calibrate=1</code> gate for the locked production map.</p>
        </div>
      )}
    </div>
  );
}
