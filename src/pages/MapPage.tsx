import { useState } from 'react';
import { ArrowRight, ArrowSquareOut, MapPin, MapTrifold, Star, X } from '@phosphor-icons/react';
import { LpuLeafletMap } from '../components/LpuLeafletMap';
import { PLACES } from '../data/campusGraph';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import type { Place } from '../types/wayfinding';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

type MapMode = 'plan' | 'live' | 'list';

export function MapPage() {
  const { lang, startNodeId } = useAppStore();
  const viewNavigate = useViewNavigate();
  const [selected, setSelected] = useState<Place | null>(null);
  const [mode, setMode] = useState<MapMode>('live');

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between gap-3 pointer-events-none">
        <div className="rounded-lg border px-3 py-2 shadow-md pointer-events-auto" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: 'var(--accent)' }}>Official campus plan</p>
          <p className="font-display font-bold text-sm">LPU Phagwara · Blocks 1–58</p>
        </div>
        <div className="flex rounded-lg border shadow-md overflow-hidden pointer-events-auto" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          {([
            ['live', 'Live map'],
            ['plan', 'Reference plan'],
            ['list', `List (${PLACES.length})`],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setMode(value)} className="h-9 px-3 text-xs font-semibold cursor-pointer" style={{ backgroundColor: mode === value ? 'var(--accent)' : 'transparent', color: mode === value ? '#fff' : 'var(--text)' }}>
              {value === 'plan' ? <MapTrifold size={14} className="inline mr-1" /> : value === 'live' ? <MapPin size={14} className="inline mr-1" /> : null}
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'list' ? (
        <div className="flex-1 overflow-y-auto p-4 pt-20 max-w-3xl w-full mx-auto">
          <div className="mb-4"><p className="text-xs uppercase tracking-[0.18em] font-bold" style={{ color: 'var(--accent)' }}>Directory</p><h1 className="font-display text-2xl font-bold">Find a campus block</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Search and route to the places shown on the official site plan.</p></div>
          <div className="rounded-xl border shadow-sm divide-y overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            {PLACES.map((p) => (
              <button key={p.id} type="button" onClick={() => viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(p.node)}`)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--accent-soft)] cursor-pointer" style={{ borderColor: 'var(--border)' }}>
                <span className="flex items-center gap-3"><span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--gold-soft)' }}><CategoryPictogram category={p.category} className="w-4 h-4" /></span><span><span className="block font-medium text-sm">{lang === 'hi' && p.hiName ? p.hiName : p.names[0]}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{p.hours ?? 'Campus place'}{p.rating ? ` · ★ ${p.rating}` : ''}</span></span></span><ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      ) : mode === 'plan' ? (
        <div className="flex-1 min-h-0 overflow-auto lpu-plan-frame p-14 md:p-16 flex items-start justify-center">
          <figure className="relative shadow-2xl max-w-[980px] w-full bg-white border-4" style={{ borderColor: 'var(--gold)' }}>
            <img src="/lpu-site-plan.webp" alt="Official Lovely Professional University campus site plan showing blocks 1 to 58" className="block w-full h-auto" />
            <figcaption className="absolute bottom-3 left-3 right-3 rounded-md px-3 py-2 text-xs font-semibold backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,253,249,.92)', color: 'var(--text)' }}>
              Use the directory or search to route to a numbered block. The plan is the visual reference; walking routes use the verified campus graph.
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative"><LpuLeafletMap lang={lang} youNodeId={startNodeId} selectedPlaceId={selected?.id ?? null} onSelectPlace={setSelected} /></div>
      )}

      {selected && mode === 'live' && (
        <div className="shrink-0 border-t p-4 z-[500] shadow-lg" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="max-w-xl mx-auto flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><CategoryPictogram category={selected.category} className="w-5 h-5" /><h2 className="font-display font-bold text-base">{lang === 'hi' && selected.hiName ? selected.hiName : selected.names[0]}</h2></div><div className="flex flex-wrap items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{selected.hours && <span>{selected.hours}</span>}{selected.rating && <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--text)' }}><Star size={12} weight="fill" style={{ color: 'var(--gold)' }} />{selected.rating} ({selected.userRatingCount})</span>}</div>{selected.address && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selected.address}</p>}</div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}><X size={16} weight="bold" /></button></div>
          <div className="max-w-xl mx-auto mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(selected.node)}`)} className="flex-1 h-11 rounded-lg text-white text-xs font-semibold cursor-pointer" style={{ backgroundColor: 'var(--accent)' }}>{t(lang, 'routeHere')}</button>{selected.lat && selected.lng && <a href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="h-11 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}>Google Maps <ArrowSquareOut size={14} weight="bold" /></a>}</div>
        </div>
      )}
    </div>
  );
}
