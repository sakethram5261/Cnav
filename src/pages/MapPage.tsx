import { useState } from 'react';
import { X, ArrowRight, ArrowSquareOut, Star } from '@phosphor-icons/react';
import { LpuLeafletMap } from '../components/LpuLeafletMap';
import { PLACES } from '../data/campusGraph';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import type { Place } from '../types/wayfinding';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

export function MapPage() {
  const { lang, startNodeId } = useAppStore();
  const viewNavigate = useViewNavigate();
  const [selected, setSelected] = useState<Place | null>(null);
  const [listMode, setListMode] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Map / List switcher */}
      <div
        className="absolute top-3 right-3 z-[500] flex rounded-full border shadow-md overflow-hidden"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setListMode(false)}
          className="h-9 px-3.5 text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: !listMode ? 'var(--accent)' : 'transparent',
            color: !listMode ? '#FFFFFF' : 'var(--text)',
          }}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setListMode(true)}
          className="h-9 px-3.5 text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: listMode ? 'var(--accent)' : 'transparent',
            color: listMode ? '#FFFFFF' : 'var(--text)',
          }}
        >
          List ({PLACES.length})
        </button>
      </div>

      {listMode ? (
        <div className="flex-1 overflow-y-auto p-4 pt-16 max-w-xl w-full mx-auto">
          <div
            className="rounded-2xl border shadow-sm divide-y overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {PLACES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(p.node)}`)
                }
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:opacity-80 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--surface-muted)' }}
                  >
                    <CategoryPictogram category={p.category} className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-sm">
                      {lang === 'hi' && p.hiName ? p.hiName : p.names[0]}
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.hours ?? 'Campus Block'}
                      {p.rating ? ` · ★ ${p.rating}` : ''}
                    </span>
                  </span>
                </span>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <LpuLeafletMap
            lang={lang}
            youNodeId={startNodeId}
            selectedPlaceId={selected?.id ?? null}
            onSelectPlace={(place) => setSelected(place)}
          />
        </div>
      )}

      {/* Selected Place Bottom Card */}
      {selected && !listMode && (
        <div
          className="shrink-0 border-t p-4 z-[500] shadow-lg"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-xl mx-auto flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CategoryPictogram category={selected.category} className="w-5 h-5" />
                <h2 className="font-display font-bold text-base">
                  {lang === 'hi' && selected.hiName ? selected.hiName : selected.names[0]}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {selected.hours && <span>{selected.hours}</span>}
                {selected.rating && (
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--text)' }}>
                    <Star size={12} weight="fill" style={{ color: 'var(--warning)' }} />
                    {selected.rating} ({selected.userRatingCount})
                  </span>
                )}
              </div>
              {selected.address && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {selected.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="max-w-xl mx-auto mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                viewNavigate(
                  `/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(selected.node)}`
                )
              }
              className="flex-1 h-11 rounded-xl text-white text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(lang, 'routeHere')}
            </button>
            {selected.lat && selected.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
              >
                <span>Google Maps</span>
                <ArrowSquareOut size={14} weight="bold" />
              </a>
            )}
            {selected.block === 34 && (
              <button
                type="button"
                onClick={() => viewNavigate('/floors/34')}
                className="h-11 px-3.5 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
              >
                {t(lang, 'floorGuide')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
