import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { ArrowRight, Star } from '@phosphor-icons/react';
import { PLACES, GRAPH_NODES } from '../data/campusGraph';
import { extractMatchedBlockNumeral, parseRoomCode, searchPlaces } from '../lib/search';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import type { PlaceCategory } from '../types/wayfinding';
import { OdometerNumeral } from '../components/OdometerNumeral';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

const CATEGORIES: Array<{ id: PlaceCategory | 'all'; en: string; hi: string }> = [
  { id: 'all', en: 'All', hi: 'सभी' },
  { id: 'block', en: 'Blocks', hi: 'ब्लॉक' },
  { id: 'lab', en: 'Labs', hi: 'लैब' },
  { id: 'food', en: 'Food', hi: 'कैंटीन' },
  { id: 'gate', en: 'Gates', hi: 'गेट' },
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

  const results = useMemo(() => searchPlaces(query, category), [query, category]);
  const parsedRoom = useMemo(() => parseRoomCode(query), [query]);
  const matchedNumeral = useMemo(
    () => extractMatchedBlockNumeral(results, query),
    [results, query]
  );

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
    <MotionConfig reducedMotion="user">
      <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* Odometer header */}
        <div className="border border-ink bg-sandstone p-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="start-select"
              className="block font-mono text-[11px] uppercase tracking-wider mb-1"
            >
              {t(lang, 'startFrom')}
            </label>
            <select
              id="start-select"
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="w-full min-h-11 border border-ink bg-paper px-2 font-sans text-sm"
            >
              {startCandidates.map((n) => (
                <option key={n.id} value={n.id}>
                  {lang === 'hi' ? n.label?.hi ?? n.id : n.label?.en ?? n.id}
                </option>
              ))}
            </select>
          </div>
          <OdometerNumeral value={matchedNumeral} className="text-5xl text-brick shrink-0" />
        </div>

        {/* Destination search */}
        <div>
          <label htmlFor="dest-search" className="sr-only">
            {t(lang, 'goTo')}
          </label>
          <input
            id="dest-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'searchPlaceholder')}
            className="w-full min-h-12 px-3 border border-ink bg-paper text-ink text-base focus:outline-none focus:ring-2 focus:ring-signal"
          />
          {parsedRoom && (
            <p className="mt-1 font-mono text-xs text-ink">
              Room code: Block {parsedRoom.block} · Floor {parsedRoom.floor} · Room {parsedRoom.room}
            </p>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`min-h-11 px-3 border border-ink font-mono text-xs uppercase shrink-0 cursor-pointer ${
                  active ? 'bg-signal text-ink font-semibold' : 'bg-paper text-ink'
                }`}
              >
                {lang === 'hi' ? c.hi : c.en}
              </button>
            );
          })}
        </div>

        {/* Live fuzzy results */}
        <div className="border border-ink divide-y divide-ink bg-paper">
          {results.length === 0 ? (
            <p className="p-4 font-mono text-xs text-ink/70">
              No matching block or room. Try "34", "34-405", or "Library".
            </p>
          ) : (
            results.map((p) => {
              const isFav = favorites.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  layout
                  style={{ viewTransitionName: `place-${p.id}` } as React.CSSProperties}
                  className="flex items-stretch justify-between"
                >
                  <button
                    type="button"
                    onClick={() => handleGo(p.id, p.node)}
                    className="flex-1 min-h-14 px-3 py-2.5 flex items-center justify-between text-left hover:bg-sandstone cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <CategoryPictogram category={p.category} />
                      <span>
                        <span className="block font-semibold text-sm">
                          {lang === 'hi' && p.hiName ? p.hiName : p.names[0]}
                        </span>
                        <span className="block font-mono text-[11px] text-ink/70">
                          {p.block ? `Block ${p.block}` : p.category.toUpperCase()}
                          {p.floor !== undefined ? ` · F${p.floor}` : ''}
                          {p.room ? ` · ${p.block}-${p.room}` : ''}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p.id)}
                    aria-label="Toggle favorite"
                    className="min-w-12 border-l border-ink flex items-center justify-center hover:bg-sandstone cursor-pointer"
                  >
                    <Star size={18} weight={isFav ? 'fill' : 'regular'} />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* A-Z quick index count */}
        <p className="font-mono text-[11px] uppercase text-ink/60">
          {PLACES.length} verified campus destinations indexed
        </p>
      </div>
    </MotionConfig>
  );
}
