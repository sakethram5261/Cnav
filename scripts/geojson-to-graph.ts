import fs from 'node:fs';

interface GeoJsonFeature {
  type: 'Feature';
  properties?: Record<string, unknown>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

const R_EARTH = 6371000;

function projectToLocalMeters(
  lon: number,
  lat: number,
  originLon: number,
  originLat: number
): { x: number; y: number } {
  const radLat = (originLat * Math.PI) / 180;
  const x = ((lon - originLon) * Math.PI) / 180 * R_EARTH * Math.cos(radLat);
  const y = -(((lat - originLat) * Math.PI) / 180 * R_EARTH);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.log('Usage: npx tsx scripts/geojson-to-graph.ts <walkways.geojson>');
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as GeoJsonCollection;
const firstCoord = raw.features[0]?.geometry.coordinates[0] ?? [75.7048, 31.2559];
const [originLon, originLat] = firstCoord;

const nodes: Array<{ id: string; x: number; y: number; floor: number; kind: string }> = [];
const edges: Array<{ a: string; b: string; meters: number; accessible: boolean; verified: boolean }> = [];

raw.features.forEach((f, fi) => {
  if (f.geometry.type !== 'LineString') return;
  const coords = f.geometry.coordinates;
  let prevId: string | null = null;
  let prevPt: { x: number; y: number } | null = null;

  coords.forEach(([lon, lat], ci) => {
    const pt = projectToLocalMeters(lon, lat, originLon, originLat);
    const id = `walk.f${fi}.${ci}`;
    nodes.push({ id, x: pt.x, y: pt.y, floor: 0, kind: 'walk' });
    if (prevId && prevPt) {
      const meters = Math.round(Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y));
      edges.push({ a: prevId, b: id, meters, accessible: true, verified: false });
    }
    prevId = id;
    prevPt = pt;
  });
});

console.log(JSON.stringify({ nodes, edges }, null, 2));
