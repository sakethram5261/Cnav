import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Crosshair, MagnifyingGlass, Star } from '@phosphor-icons/react';
import { PLACES, GRAPH_NODES } from '../data/campusGraph';
import { parseRoomCode, searchPlaces } from '../lib/search';
import { detectCurrentBlock } from '../lib/geo';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import type { PlaceCategory } from '../types/wayfinding';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

const CATEGORIES: Array<{ id: PlaceCategory | 'all'; en: string; hi: string }> = [
  { id: 'all', en: 'All', hi: 'सभी' },
  { id: 'block', en: 'Blocks', hi: 'ब्लॉक' },
  { id: 'lab', en: 'Labs', hi: 'लैब' },
  { id: 'food', en: 'Food', hi: 'कैंटीन' },
  { id: 'gate', en: 'Gates', hi: 'गेट' },
  { id: 'admin', en: 'Admin', hi: 'प्रशासन' },
  { id: 'library', en: 'Library', hi: 'पुस्तकालय' },
  { id: 'auditorium', en: 'Auditorium', hi: 'ऑडिटोरियम' },
  { id: 'sports', en: 'Sports', hi: 'खेल' },
];

export function FindPage() {
  const [params] = useSearchParams();
  const { lang, startNodeId, setStartNodeId, favorites, toggleFavorite, pushRecent } =
    useAppStore();
  const viewNavigate = useViewNavigate();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleUseMyLocation = async () => {
    setLocating(true);
    setLocError(null);
    const res = await detectCurrentBlock();
    setLocating(false);
    if (res.ok) {
      setStartNodeId(res.node.id);
    } else {
      setLocError(res.message);
    }
  };

  const results = useMemo(() => searchPlaces(query, category), [query, category]);
  const parsedRoom = useMemo(() => parseRoomCode(query), [query]);

  const startCandidates = useMemo(
    () =>
      GRAPH_NODES.filter(
        (n) => n.kind === 'gate' || n.kind === 'door' || n.kind === 'anchor'
      ),
    []
  );

  const handleGo = (placeId: string, nodeId: string) => {
    pushRecent(placeId);
    viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(nodeId)}`);
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
      {/* Start + Destination Card */}
      <div
        className="rounded-2xl border p-3.5 shadow-sm flex flex-col gap-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="start-select"
              className="block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {t(lang, 'startFrom')}
            </label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              <Crosshair size={14} weight="bold" />
              <span>{locating ? 'Locating…' : 'Use my location'}</span>
            </button>
          </div>
          <select
            id="start-select"
            value={startNodeId}
            onChange={(e) => setStartNodeId(e.target.value)}
            className="w-full h-11 rounded-xl border px-3 text-sm font-medium"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {startCandidates.map((n) => (
              <option key={n.id} value={n.id}>
                {lang === 'hi' ? n.label?.hi ?? n.id : n.label?.en ?? n.id}
              </option>
            ))}
          </select>
          {locError && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--warning)' }}>
              {locError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="dest-search"
            className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {t(lang, 'goTo')}
          </label>
          <div
            className="flex items-center rounded-xl border px-3"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border)',
            }}
          >
            <MagnifyingGlass size={17} style={{ color: 'var(--text-muted)' }} />
            <input
              id="dest-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(lang, 'searchPlaceholder')}
              className="w-full h-11 px-2.5 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {parsedRoom && (
            <p
              className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Block {parsedRoom.block} · Floor {parsedRoom.floor} · Room {parsedRoom.room}
            </p>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className="h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer border transition-colors"
              style={{
                backgroundColor: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? '#FFFFFF' : 'var(--text)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {lang === 'hi' ? c.hi : c.en}
            </button>
          );
        })}
      </div>

      {/* Results List */}
      <div
        className="rounded-2xl border shadow-sm divide-y overflow-hidden"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {results.length === 0 ? (
          <p className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            No matching block or room. Try &quot;34&quot;, &quot;34-405&quot;, &quot;14&quot;, or &quot;Library&quot;.
          </p>
        ) : (
          results.map((p) => {
            const isFav = favorites.includes(p.id);
            return (
              <div
                key={p.id}
                className="flex items-stretch justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => handleGo(p.id, p.node)}
                  className="flex-1 px-4 py-3 flex items-center justify-between text-left hover:opacity-80 cursor-pointer"
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
                        {p.block ? `Block ${p.block}` : p.category.toUpperCase()}
                        {p.floor !== undefined ? ` · Floor ${p.floor}` : ''}
                        {p.room ? ` · ${p.block}-${p.room}` : ''}
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(p.id)}
                  aria-label="Toggle favorite"
                  className="w-12 border-l flex items-center justify-center cursor-pointer"
                  style={{
                    borderColor: 'var(--border)',
                    color: isFav ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  <Star size={18} weight={isFav ? 'fill' : 'regular'} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {PLACES.length} LPU campus destinations indexed
      </p>
    </div>
  );
}
