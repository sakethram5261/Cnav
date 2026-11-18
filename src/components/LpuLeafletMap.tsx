import { useState } from 'react';
import { Crosshair, Minus, Plus, Ruler, Warning } from '@phosphor-icons/react';
import type { ComputedRoute, Lang, Place } from '../types/wayfinding';

interface LpuLeafletMapProps {
  route?: ComputedRoute | null;
  activeStepIndex?: number;
  youNodeId?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: Place) => void;
  lang: Lang;
}

/**
 * The supplied LPU site plan is intentionally the only campus geometry shown here.
 * The old generated Leaflet layer used approximate points that could place labels and
 * route lines through buildings. Until a proper GIS trace is available, we prefer a
 * truthful plan plus written route guidance over a misleading overlay.
 */
export function LpuLeafletMap({ route, activeStepIndex = 0 }: LpuLeafletMapProps) {
  const [scale, setScale] = useState(1);
  const activeStep = route?.steps[activeStepIndex];
  const zoomBy = (factor: number) => setScale((current) => Math.min(2.4, Math.max(0.65, current * factor)));

  return (
    <div className="relative w-full h-full overflow-hidden lpu-plan-frame">
      <div className="absolute top-3 left-3 z-10 flex flex-col rounded-lg border shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button type="button" onClick={() => zoomBy(1.2)} aria-label="Zoom in" className="min-w-10 min-h-10 flex items-center justify-center border-b cursor-pointer" style={{ borderColor: 'var(--border)' }}><Plus size={16} weight="bold" /></button>
        <button type="button" onClick={() => zoomBy(0.82)} aria-label="Zoom out" className="min-w-10 min-h-10 flex items-center justify-center border-b cursor-pointer" style={{ borderColor: 'var(--border)' }}><Minus size={16} weight="bold" /></button>
        <button type="button" onClick={() => setScale(1)} aria-label="Reset map" className="min-w-10 min-h-10 flex items-center justify-center cursor-pointer"><Crosshair size={16} weight="bold" /></button>
      </div>

      <div className="w-full h-full overflow-auto flex items-start justify-center p-14">
        <img src="/lpu-site-plan.webp" alt="Official Lovely Professional University campus site plan" className="max-w-none w-[min(100%,980px)] h-auto shadow-2xl border-4 origin-top transition-transform duration-200" style={{ borderColor: 'var(--gold)', transform: `scale(${scale})` }} />
      </div>

      <div className="absolute top-3 right-3 max-w-[min(360px,calc(100%-5rem))] rounded-lg border shadow-lg px-3 py-2" style={{ backgroundColor: 'rgba(255,253,249,.94)', borderColor: 'var(--gold)' }}>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: 'var(--accent)' }}><Ruler size={13} weight="bold" /> Official site plan</div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Labels and walkways are taken from the LPU reference map. No unverified route line is drawn over buildings.</p>
      </div>

      {activeStep && (
        <div className="absolute bottom-3 left-3 right-3 md:left-auto md:max-w-[380px] rounded-xl border shadow-xl px-4 py-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--accent)' }}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: 'var(--accent)' }}><Warning size={13} weight="bold" /> Step {activeStepIndex + 1} of {route?.steps.length ?? 0}</div>
          <p className="font-semibold text-sm mt-1">{activeStep.instruction.en}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{activeStep.meters} m · follow the marked walkway/road on the plan</p>
        </div>
      )}
    </div>
  );
}
