import Fuse from 'fuse.js';
import { PLACES } from '../data/campusGraph';
import type { Place, PlaceCategory } from '../types/wayfinding';

const ROOM_CODE_RE = /^(\d{1,2})[-\s]?([0-9])(\d{2})$/;

export interface ParsedRoomCode {
  block: number;
  floor: number;
  room: string;
  formatted: string;
}

export function parseRoomCode(query: string): ParsedRoomCode | null {
  const trimmed = query.trim();
  const m = ROOM_CODE_RE.exec(trimmed);
  if (!m) return null;
  const block = Number(m[1]);
  const floor = Number(m[2]);
  const room = `${m[2]}${m[3]}`;
  return {
    block,
    floor,
    room,
    formatted: `${block}-${room}`,
  };
}

const fuse = new Fuse(PLACES, {
  keys: [
    { name: 'names', weight: 2 },
    { name: 'hiName', weight: 1.8 },
    { name: 'aliases', weight: 2 },
    { name: 'room', weight: 1.5 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
});

export function searchPlaces(
  query: string,
  category?: PlaceCategory | 'all'
): Place[] {
  const pool =
    category && category !== 'all'
      ? PLACES.filter((p) => p.category === category)
      : PLACES;

  const q = query.trim();
  if (!q) return pool;

  const parsed = parseRoomCode(q);
  if (parsed) {
    const exactRoom = pool.filter(
      (p) => p.block === parsed.block && p.room === parsed.room
    );
    if (exactRoom.length > 0) return exactRoom;

    const sameBlockFloor = pool.filter(
      (p) => p.block === parsed.block && p.floor === parsed.floor
    );
    if (sameBlockFloor.length > 0) return sameBlockFloor;

    const sameBlock = pool.filter((p) => p.block === parsed.block);
    if (sameBlock.length > 0) return sameBlock;
  }

  // Exact block number match e.g. "34", "b34", "ब्लॉक 34"
  const blockDigits = q.match(/^(?:b|block\s*|ब्लॉक\s*)?(\d{1,2})$/i);
  if (blockDigits) {
    const num = Number(blockDigits[1]);
    const blockMatches = pool.filter((p) => p.block === num);
    if (blockMatches.length > 0) {
      // Put main block entry first, then rooms
      return blockMatches.sort((a, b) => (a.room ? 1 : 0) - (b.room ? 1 : 0));
    }
  }

  const hits = fuse.search(q).map((r) => r.item);
  if (category && category !== 'all') {
    return hits.filter((p) => p.category === category);
  }
  return hits;
}

export function extractMatchedBlockNumeral(places: Place[], query: string): string {
  const parsed = parseRoomCode(query);
  if (parsed) return String(parsed.block).padStart(2, '0');
  const first = places[0];
  if (first?.block) return String(first.block).padStart(2, '0');
  return '34';
}
