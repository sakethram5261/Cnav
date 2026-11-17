import rawConfig from '../data/config.json';
import { GRAPH_EDGES, GRAPH_NODES, PLACES } from '../data/campusGraph';
import type {
  AppConfig,
  ComputedRoute,
  GraphEdge,
  GraphNode,
  RouteStep,
} from '../types/wayfinding';

const config = rawConfig as AppConfig;

const nodeMap = new Map<string, GraphNode>(GRAPH_NODES.map((n) => [n.id, n]));

interface AdjItem {
  to: string;
  edge: GraphEdge;
}

const adjacency = new Map<string, AdjItem[]>();
for (const edge of GRAPH_EDGES) {
  if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
  if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
  adjacency.get(edge.a)!.push({ to: edge.b, edge });
  adjacency.get(edge.b)!.push({ to: edge.a, edge });
}

export function getNode(id: string): GraphNode | undefined {
  return nodeMap.get(id);
}

export function isClassChangeWindow(now: Date = new Date()): boolean {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const current = `${hh}:${mm}`;
  return config.classChangeWindows.some(
    (w) => current >= w.start && current <= w.end
  );
}

function headingAngle(a: GraphNode, b: GraphNode): number | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.hypot(dx, dy) < 1) return null;
  return Math.atan2(dy, dx);
}

function angleDiffDeg(a1: number, a2: number): number {
  let diff = ((a2 - a1) * 180) / Math.PI;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

function edgeDurationSec(
  edge: GraphEdge,
  fromNode: GraphNode,
  toNode: GraphNode,
  crowdActive: boolean
): number {
  let sec = edge.meters / config.walkSpeedMps;
  if (crowdActive && edge.crowd) {
    sec *= config.crowdMultiplier;
  }
  const floorDelta = Math.abs(toNode.floor - fromNode.floor);
  if (floorDelta > 0) {
    if (toNode.kind === 'stairs' || fromNode.kind === 'stairs') {
      sec += floorDelta * config.stairsPenaltySecPerFloor;
    } else if (toNode.kind === 'lift' || fromNode.kind === 'lift') {
      sec += config.liftWaitSec;
    }
  }
  return sec;
}

export interface RouteOptions {
  accessible?: boolean;
  crowdActive?: boolean;
  now?: Date;
}

export function computeRoute(
  fromId: string,
  toId: string,
  options: RouteOptions = {}
): ComputedRoute | null {
  if (!nodeMap.has(fromId) || !nodeMap.has(toId)) return null;
  const accessible = Boolean(options.accessible);
  const crowdActive =
    options.crowdActive !== undefined
      ? options.crowdActive
      : isClassChangeWindow(options.now);

  if (fromId === toId) {
    const n = nodeMap.get(fromId)!;
    const place = PLACES.find((p) => p.node === toId);
    const labelEn = place ? place.names[0] : n.label?.en ?? toId;
    const labelHi = place ? place.hiName ?? place.names[0] : n.label?.hi ?? toId;
    return {
      from: fromId,
      to: toId,
      nodes: [fromId],
      edges: [],
      steps: [
        {
          id: 'step-0',
          index: 0,
          fromNode: fromId,
          toNode: toId,
          edgeIds: [],
          nodeIds: [fromId],
          meters: 0,
          seconds: 0,
          floorFrom: n.floor,
          floorTo: n.floor,
          kind: 'arrive',
          instruction: {
            en: `You are already at ${labelEn}.`,
            hi: `आप पहले से ${labelHi} पर हैं।`,
          },
          verified: true,
        },
      ],
      totalMeters: 0,
      totalSeconds: 0,
      crowdActive,
      accessible,
      allVerified: true,
      floorsTraversed: [n.floor],
      unverifiedCount: 0,
    };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: GraphEdge }>();
  const prevAngle = new Map<string, number | null>();
  const visited = new Set<string>();

  dist.set(fromId, 0);
  prevAngle.set(fromId, null);

  const queue: string[] = [fromId];

  while (queue.length > 0) {
    queue.sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity));
    const u = queue.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === toId) break;

    const uNode = nodeMap.get(u)!;
    const uDist = dist.get(u) ?? Infinity;
    const uAngle = prevAngle.get(u) ?? null;

    for (const item of adjacency.get(u) ?? []) {
      if (accessible && !item.edge.accessible) continue;
      if (visited.has(item.to)) continue;

      const vNode = nodeMap.get(item.to)!;
      let cost = edgeDurationSec(item.edge, uNode, vNode, crowdActive);
      const nextAngle =
        uNode.floor === vNode.floor ? headingAngle(uNode, vNode) : null;

      if (uAngle !== null && nextAngle !== null) {
        if (Math.abs(angleDiffDeg(uAngle, nextAngle)) > 40) {
          cost += config.turnPenaltySec;
        }
      }

      const alt = uDist + cost;
      if (alt < (dist.get(item.to) ?? Infinity)) {
        dist.set(item.to, alt);
        prev.set(item.to, { node: u, edge: item.edge });
        prevAngle.set(item.to, nextAngle);
        queue.push(item.to);
      }
    }
  }

  if (!prev.has(toId)) return null;

  const nodes: string[] = [];
  const edges: GraphEdge[] = [];
  let curr = toId;
  while (curr !== fromId) {
    nodes.unshift(curr);
    const p = prev.get(curr)!;
    edges.unshift(p.edge);
    curr = p.node;
  }
  nodes.unshift(fromId);

  const steps = buildSteps(nodes, edges, crowdActive);
  const totalMeters = edges.reduce((sum, e) => sum + e.meters, 0);
  const totalSeconds = Math.round(
    steps.reduce((sum, s) => sum + s.seconds, 0)
  );
  const unverifiedCount = edges.filter((e) => !e.verified).length;
  const verifiedDates = edges
    .map((e) => e.verifiedOn)
    .filter((d): d is string => Boolean(d))
    .sort();
  const floorsSet = new Set(nodes.map((id) => nodeMap.get(id)!.floor));

  return {
    from: fromId,
    to: toId,
    nodes,
    edges,
    steps,
    totalMeters,
    totalSeconds,
    crowdActive,
    accessible,
    allVerified: unverifiedCount === 0,
    oldestVerifiedOn: verifiedDates[0],
    unverifiedCount,
    floorsTraversed: Array.from(floorsSet).sort((a, b) => a - b),
  };
}

function buildSteps(
  nodes: string[],
  edges: GraphEdge[],
  crowdActive: boolean
): RouteStep[] {
  const steps: RouteStep[] = [];
  let i = 0;
  let prevOutdoorAngle: number | null = null;

  while (i < edges.length) {
    const startNode = nodeMap.get(nodes[i])!;
    const nextNode = nodeMap.get(nodes[i + 1])!;
    const firstEdge = edges[i];

    // Group consecutive vertical edges (stairs or lift)
    if (startNode.floor !== nextNode.floor) {
      const isLift =
        startNode.kind === 'lift' || nextNode.kind === 'lift';
      const verticalNodes = [nodes[i], nodes[i + 1]];
      const verticalEdges = [firstEdge];
      let j = i + 1;
      while (j < edges.length) {
        const a = nodeMap.get(nodes[j])!;
        const b = nodeMap.get(nodes[j + 1])!;
        if (a.floor !== b.floor && ((a.kind === 'lift' || b.kind === 'lift') === isLift)) {
          verticalNodes.push(nodes[j + 1]);
          verticalEdges.push(edges[j]);
          j++;
        } else {
          break;
        }
      }
      const endFloorNode = nodeMap.get(verticalNodes[verticalNodes.length - 1])!;
      const goingUp = endFloorNode.floor > startNode.floor;
      const meters = verticalEdges.reduce((s, e) => s + e.meters, 0);
      const seconds = verticalEdges.reduce(
        (s, e, idx) =>
          s +
          edgeDurationSec(
            e,
            nodeMap.get(verticalNodes[idx])!,
            nodeMap.get(verticalNodes[idx + 1])!,
            crowdActive
          ),
        0
      );
      const targetFloor = endFloorNode.floor;
      const floorTextEn = targetFloor === 0 ? 'Ground Floor' : `Floor ${targetFloor}`;
      const floorTextHi = targetFloor === 0 ? 'भूतल' : `मंज़िल ${targetFloor}`;

      steps.push({
        id: `step-${steps.length}`,
        index: steps.length,
        fromNode: startNode.id,
        toNode: endFloorNode.id,
        edgeIds: verticalEdges.map((e) => `${e.a}->${e.b}`),
        nodeIds: verticalNodes,
        meters,
        seconds,
        floorFrom: startNode.floor,
        floorTo: targetFloor,
        kind: isLift ? 'lift' : 'stairs',
        instruction: {
          en: isLift
            ? `Take Lift A ${goingUp ? 'up' : 'down'} to ${floorTextEn}.`
            : `Take Stairs A ${goingUp ? 'up' : 'down'} to ${floorTextEn}.`,
          hi: isLift
            ? `लिफ्ट A से ${floorTextHi} पर ${goingUp ? 'ऊपर' : 'नीचे'} जाएं।`
            : `सीढ़ी A से ${floorTextHi} पर ${goingUp ? 'ऊपर' : 'नीचे'} जाएं।`,
        },
        landmark: verticalEdges[verticalEdges.length - 1].landmark,
        verified: verticalEdges.every((e) => e.verified),
      });
      prevOutdoorAngle = null;
      i = j;
      continue;
    }

    // Group consecutive horizontal edges with similar heading (< 30 deg)
    const groupNodes = [nodes[i], nodes[i + 1]];
    const groupEdges = [firstEdge];
    const baseAngle = headingAngle(startNode, nextNode);
    let j = i + 1;

    while (j < edges.length) {
      const a = nodeMap.get(nodes[j])!;
      const b = nodeMap.get(nodes[j + 1])!;
      if (a.floor !== b.floor) break;
      const ang = headingAngle(a, b);
      if (baseAngle !== null && ang !== null && Math.abs(angleDiffDeg(baseAngle, ang)) < 30) {
        groupNodes.push(nodes[j + 1]);
        groupEdges.push(edges[j]);
        j++;
      } else {
        break;
      }
    }

    const endNode = nodeMap.get(groupNodes[groupNodes.length - 1])!;
    const meters = groupEdges.reduce((s, e) => s + e.meters, 0);
    const seconds = groupEdges.reduce(
      (s, e, idx) =>
        s +
        edgeDurationSec(
          e,
          nodeMap.get(groupNodes[idx])!,
          nodeMap.get(groupNodes[idx + 1])!,
          crowdActive
        ),
      0
    );

    let turnPhraseEn = '';
    let turnPhraseHi = '';
    let kind: RouteStep['kind'] = 'walk';

    if (prevOutdoorAngle !== null && baseAngle !== null) {
      const diff = angleDiffDeg(prevOutdoorAngle, baseAngle);
      if (diff > 35) {
        turnPhraseEn = 'Turn right and walk ';
        turnPhraseHi = 'दाएं मुड़ें और ';
        kind = 'turn';
      } else if (diff < -35) {
        turnPhraseEn = 'Turn left and walk ';
        turnPhraseHi = 'बाएं मुड़ें और ';
        kind = 'turn';
      }
    }

    const landmarkEdge = groupEdges.find((e) => e.landmark) ?? groupEdges[groupEdges.length - 1];
    const lmEn = landmarkEdge.landmark?.en;
    const lmHi = landmarkEdge.landmark?.hi;

    const isEnteringBlock34 =
      startNode.id === 'b34.door' && endNode.id.startsWith('b34.f0');

    let en: string;
    let hi: string;

    if (isEnteringBlock34) {
      kind = 'enter';
      en = `Enter Block 34 (${meters} m) past ${lmEn ?? 'security desk'}.`;
      hi = `ब्लॉक 34 में प्रवेश करें (${meters} मी), ${lmHi ?? 'सुरक्षा डेस्क'} के पास से।`;
    } else if (turnPhraseEn) {
      en = `${turnPhraseEn}${meters} m${lmEn ? ` past ${lmEn}` : ''}.`;
      hi = `${turnPhraseHi}${meters} मी चलें${lmHi ? `, ${lmHi} के पास` : ''}।`;
    } else {
      en = `Walk ${meters} m${lmEn ? ` by ${lmEn}` : ''}.`;
      hi = `${meters} मी सीधे चलें${lmHi ? `, ${lmHi} के पास` : ''}।`;
    }

    steps.push({
      id: `step-${steps.length}`,
      index: steps.length,
      fromNode: startNode.id,
      toNode: endNode.id,
      edgeIds: groupEdges.map((e) => `${e.a}->${e.b}`),
      nodeIds: groupNodes,
      meters,
      seconds,
      floorFrom: startNode.floor,
      floorTo: endNode.floor,
      kind,
      instruction: { en, hi },
      landmark: landmarkEdge.landmark,
      verified: groupEdges.every((e) => e.verified),
    });

    if (baseAngle !== null) prevOutdoorAngle = baseAngle;
    i = j;
  }

  // Append final arrival step
  const finalNode = nodeMap.get(nodes[nodes.length - 1])!;
  const place = PLACES.find((p) => p.node === finalNode.id);
  const destEn = place ? place.names[0] : finalNode.label?.en ?? finalNode.id;
  const destHi = place ? place.hiName ?? place.names[0] : finalNode.label?.hi ?? finalNode.id;

  steps.push({
    id: `step-${steps.length}`,
    index: steps.length,
    fromNode: finalNode.id,
    toNode: finalNode.id,
    edgeIds: [],
    nodeIds: [finalNode.id],
    meters: 0,
    seconds: 0,
    floorFrom: finalNode.floor,
    floorTo: finalNode.floor,
    kind: 'arrive',
    instruction: {
      en: `Arrive at ${destEn}.`,
      hi: `${destHi} पर पहुँच गए।`,
    },
    verified: true,
  });

  return steps;
}

export function findNearestOutdoorNode(x: number, y: number): GraphNode {
  let best = GRAPH_NODES[0];
  let bestDist = Infinity;
  for (const n of GRAPH_NODES) {
    if (n.floor !== 0) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

export function formatDuration(seconds: number, lang: 'en' | 'hi' = 'en'): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return lang === 'hi' ? `${mins} मि` : `${mins} min`;
}
