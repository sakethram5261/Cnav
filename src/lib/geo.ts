import { findNearestNodeByLatLng } from './routing';
import type { GraphNode } from '../types/wayfinding';

export type GeoResult =
  | {
      ok: true;
      lat: number;
      lng: number;
      node: GraphNode;
      distanceMeters: number;
      offCampus: boolean;
    }
  | {
      ok: false;
      reason: 'unsupported' | 'denied' | 'timeout';
      message: string;
    };

function getPos(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export async function detectCurrentBlock(): Promise<GeoResult> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'GPS is not supported on this browser.',
    };
  }

  let pos: GeolocationPosition;
  try {
    pos = await getPos({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  } catch (err) {
    const geoErr = err as GeolocationPositionError;
    if (geoErr?.code === 1) {
      return {
        ok: false,
        reason: 'denied',
        message: 'Location permission denied. Enable location in browser settings or pick your block below.',
      };
    }
    // Retry with Wi-Fi / network location (faster indoors)
    try {
      pos = await getPos({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      });
    } catch {
      return {
        ok: false,
        reason: 'timeout',
        message: 'Could not lock GPS indoors. Pick your block from the list.',
      };
    }
  }

  const { latitude, longitude } = pos.coords;
  const { node, distanceMeters } = findNearestNodeByLatLng(latitude, longitude);
  return {
    ok: true,
    lat: latitude,
    lng: longitude,
    node,
    distanceMeters,
    offCampus: distanceMeters > 1200,
  };
}
