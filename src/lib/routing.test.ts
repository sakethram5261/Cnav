import { describe, expect, it } from 'vitest';
import { computeRoute, isClassChangeWindow } from './routing';
import { parseRoomCode, searchPlaces } from './search';

describe('Room-code parser & fuzzy search', () => {
  it('parses 34-405 and 34 405 and 34405', () => {
    expect(parseRoomCode('34-405')).toEqual({
      block: 34,
      floor: 4,
      room: '405',
      formatted: '34-405',
    });
    expect(parseRoomCode('34 405')?.formatted).toBe('34-405');
    expect(parseRoomCode('34405')?.formatted).toBe('34-405');
    expect(parseRoomCode('hello')).toBeNull();
  });

  it('resolves 34, b34, 34-405, Block 34, and ब्लॉक 34', () => {
    expect(searchPlaces('34')[0].id).toBe('block-34');
    expect(searchPlaces('b34')[0].id).toBe('block-34');
    expect(searchPlaces('Block 34')[0].id).toBe('block-34');
    expect(searchPlaces('ब्लॉक 34')[0].id).toBe('block-34');
    expect(searchPlaces('34-405')[0].id).toBe('b34-405');
  });
});

describe('Dijkstra campus & Block 34 multi-floor routing', () => {
  it('routes Main Gate to Lab 34-405 with stairs and floor-level steps', () => {
    const route = computeRoute('gate.main', 'b34.f4.lab405', {
      crowdActive: false,
    });
    expect(route).not.toBeNull();
    expect(route!.floorsTraversed).toContain(0);
    expect(route!.floorsTraversed).toContain(4);
    expect(route!.allVerified).toBe(true);
    expect(route!.steps.some((s) => s.kind === 'stairs')).toBe(true);
    expect(route!.steps[route!.steps.length - 1].kind).toBe('arrive');
  });

  it('uses Lift A when accessible mode is enabled', () => {
    const route = computeRoute('gate.main', 'b34.f4.lab405', {
      accessible: true,
      crowdActive: false,
    });
    expect(route).not.toBeNull();
    expect(route!.edges.every((e) => e.accessible)).toBe(true);
    expect(route!.steps.some((s) => s.kind === 'lift')).toBe(true);
    expect(route!.steps.some((s) => s.kind === 'stairs')).toBe(false);
  });

  it('applies crowd multiplier during class-change windows', () => {
    const offPeak = computeRoute('gate.main', 'b34.f4.lab405', {
      crowdActive: false,
    });
    const peak = computeRoute('gate.main', 'b34.f4.lab405', {
      crowdActive: true,
    });
    expect(peak!.totalSeconds).toBeGreaterThan(offPeak!.totalSeconds);
    expect(isClassChangeWindow(new Date('2026-11-17T09:55:00'))).toBe(true);
    expect(isClassChangeWindow(new Date('2026-11-17T10:30:00'))).toBe(false);
  });

  it('flags unverified routes when traversing unverified edges', () => {
    const route = computeRoute('b34.door', 'sports.ground', {
      crowdActive: false,
    });
    expect(route).not.toBeNull();
    expect(route!.allVerified).toBe(false);
    expect(route!.unverifiedCount).toBeGreaterThan(0);
  });
});
