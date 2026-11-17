export type NodeKind =
  | 'walk'
  | 'gate'
  | 'door'
  | 'stairs'
  | 'lift'
  | 'corridor'
  | 'anchor';

export interface GraphNode {
  id: string; // e.g. "b34.f4.stairsA"
  x: number; // campus-local metres, origin at main gate
  y: number;
  floor: number; // 0 = ground
  kind: NodeKind;
  block?: number;
  label?: { en: string; hi: string };
}

export interface GraphEdge {
  a: string;
  b: string;
  meters: number;
  accessible: boolean; // false for stairs-only links
  crowd?: 'hall' | 'stairs';
  landmark?: {
    en: string;
    hi: string;
    side?: 'left' | 'right';
  };
  verified: boolean;
  verifiedOn?: string; // ISO date
}

export type PlaceCategory =
  | 'block'
  | 'lab'
  | 'food'
  | 'gate'
  | 'admin'
  | 'sports'
  | 'library'
  | 'auditorium'
  | 'restroom';

export interface Place {
  id: string;
  names: string[]; // [en, ...]
  hiName?: string;
  aliases: string[];
  block?: number;
  floor?: number;
  room?: string;
  node: string;
  category: PlaceCategory;
  photo?: string;
  hours?: string;
}

export interface BuildingFootprint {
  id: string;
  block?: number;
  name: string;
  hiName: string;
  /** Polygon points in campus-local metres */
  points: [number, number][];
  heightM: number;
  kind: 'academic' | 'admin' | 'facility' | 'gate';
  placeId?: string;
  floors?: number;
}

export interface LandmarkTriageItem {
  id: string;
  name: string;
  hiName: string;
  area: string;
  hiArea: string;
  photo: string;
  visibleFrom: string[]; // nodeIds
}

export interface ClassChangeWindow {
  start: string; // "09:50"
  end: string; // "10:00"
}

export interface AppConfig {
  walkSpeedMps: number;
  stairsPenaltySecPerFloor: number;
  liftWaitSec: number;
  turnPenaltySec: number;
  crowdMultiplier: number;
  classChangeWindows: ClassChangeWindow[];
}

export interface RouteStep {
  id: string;
  index: number;
  fromNode: string;
  toNode: string;
  edgeIds: string[];
  nodeIds: string[];
  meters: number;
  seconds: number;
  floorFrom: number;
  floorTo: number;
  kind: 'walk' | 'turn' | 'stairs' | 'lift' | 'enter' | 'arrive';
  instruction: { en: string; hi: string };
  landmark?: { en: string; hi: string; side?: 'left' | 'right' };
  verified: boolean;
}

export interface ComputedRoute {
  from: string;
  to: string;
  nodes: string[];
  edges: GraphEdge[];
  steps: RouteStep[];
  totalMeters: number;
  totalSeconds: number;
  crowdActive: boolean;
  accessible: boolean;
  allVerified: boolean;
  oldestVerifiedOn?: string;
  unverifiedCount: number;
  floorsTraversed: number[];
}

export type Lang = 'en' | 'hi';
