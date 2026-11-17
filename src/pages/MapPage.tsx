import { useState } from 'react';
import { X, ArrowRight } from '@phosphor-icons/react';
import { CampusMapSvg } from '../components/CampusMapSvg';
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
    <div className="relative flex-1 flex flex-col h-[calc(100dvh-7.5rem)]">
      {/* Map / Accessible list view toggle */}
      <div className="absolute top-3 right-3 z-20 flex border border-ink bg-paper">
        <button
          type="button"
          onClick={() => setListMode((v) => !v)}
          className="min-h-11 px-3 font-mono text-xs uppercase font-semibold cursor-pointer"
        >
          {listMode ? t(lang, 'mapView') : t(lang, 'listView')}
        </button>
      </div>

      {listMode ? (
        <div className="flex-1 overflow-y-auto p-4 max-w-xl w-full mx-auto">
          <h1 className="font-block-numeral text-lg uppercase mb-3">
            {t(lang, 'campusMap')}
          </h1>
          <div className="border border-ink divide-y divide-ink bg-paper">
            {PLACES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(p.node)}`)
                }
                className="w-full min-h-12 px-3 py-2.5 flex items-center justify-between text-left hover:bg-sandstone cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <CategoryPictogram category={p.category} />
                  <span>
                    <span className="block font-semibold text-sm">
                      {lang === 'hi' && p.hiName ? p.hiName : p.names[0]}
                    </span>
                    {p.hours && (
                      <span className="block font-mono text-[11px] text-ink/70">{p.hours}</span>
                    )}
                  </span>
                </span>
                <ArrowRight size={16} weight="bold" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <CampusMapSvg
            lang={lang}
            youNodeId={startNodeId}
            selectedPlaceId={selected?.id ?? null}
            onSelectPlace={(place) => setSelected(place)}
            bottomInsetPx={selected ? 180 : 60}
          />
        </div>
      )}

      {/* Tapped place bottom sheet */}
      {selected && !listMode && (
        <div className="border-t border-ink bg-paper p-4 z-30">
          <div className="max-w-xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {selected.photo && (
                <img
                  src={selected.photo}
                  alt={selected.names[0]}
                  className="w-16 h-16 object-cover border border-ink shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <CategoryPictogram category={selected.category} />
                  <h2 className="font-block-numeral text-lg uppercase">
                    {lang === 'hi' && selected.hiName ? selected.hiName : selected.names[0]}
                  </h2>
                </div>
                {selected.hours && (
                  <p className="font-mono text-xs text-ink/75 mt-1">{selected.hours}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="min-w-11 min-h-11 border border-ink flex items-center justify-center cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="max-w-xl mx-auto mt-3 flex gap-2">
            <button
              type="button"
              onClick={() =>
                viewNavigate(
                  `/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(selected.node)}`
                )
              }
              className="flex-1 min-h-12 border border-ink bg-signal text-ink font-mono text-xs font-semibold uppercase cursor-pointer"
            >
              {t(lang, 'routeHere')}
            </button>
            {selected.block === 34 && (
              <button
                type="button"
                onClick={() => viewNavigate('/floors/34')}
                className="min-h-12 px-4 border border-ink bg-sandstone text-ink font-mono text-xs font-semibold uppercase cursor-pointer"
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
