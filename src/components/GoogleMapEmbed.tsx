import { useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import type { Place } from '../types/wayfinding';

interface GoogleMapEmbedProps {
  place?: Place | null;
  lat?: number;
  lng?: number;
}

export function GoogleMapEmbed({
  place,
  lat = 31.2564,
  lng = 75.7031,
}: GoogleMapEmbedProps) {
  const [satellite, setSatellite] = useState(true);
  const targetLat = place?.lat ?? lat;
  const targetLng = place?.lng ?? lng;
  const query = place
    ? `${place.names[0]}, Lovely Professional University, Phagwara`
    : `${targetLat},${targetLng}`;

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&t=${satellite ? 'k' : 'm'}&z=17&ie=UTF8&iwloc=&output=embed`;

  const externalUrl = place?.googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
      )}&query_place_id=${place.googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`;

  return (
    <div className="relative w-full h-full bg-sandstone">
      <iframe
        title="Google Maps — LPU Campus"
        src={embedUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          className="min-h-10 px-3 border border-ink bg-paper font-mono text-xs font-semibold uppercase shadow-[2px_2px_0_var(--ink)] cursor-pointer"
        >
          {satellite ? 'Map' : 'Satellite'}
        </button>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-10 px-3 border border-ink bg-signal text-ink font-mono text-xs font-semibold uppercase flex items-center gap-1.5 shadow-[2px_2px_0_var(--ink)]"
        >
          <span>Open Google Maps</span>
          <ArrowSquareOut size={14} weight="bold" />
        </a>
      </div>
    </div>
  );
}
