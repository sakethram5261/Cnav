import { useMemo, useState } from 'react';
import { Check, ArrowRight } from '@phosphor-icons/react';
import { GRAPH_NODES, LANDMARK_TRIAGE } from '../data/campusGraph';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import { useViewNavigate } from '../components/Shell';

const nodeMap = new Map(GRAPH_NODES.map((n) => [n.id, n]));

export function LostPage() {
  const { lang, setStartNodeId } = useAppStore();
  const viewNavigate = useViewNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleLandmark = (id: string) => {
    setSelectedIds((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= 3) return [...curr.slice(1), id];
      return [...curr, id];
    });
  };

  const candidateNodeIds = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const sets = selectedIds
      .map((id) => LANDMARK_TRIAGE.find((l) => l.id === id)?.visibleFrom ?? [])
      .map((arr) => new Set(arr));

    const first = Array.from(sets[0]);
    const intersection = first.filter((nodeId) =>
      sets.every((s) => s.has(nodeId))
    );
    if (intersection.length > 0) return intersection;

    // Fallback: union ranked by frequency
    const counts = new Map<string, number>();
    for (const s of sets) {
      for (const nid of s) counts.set(nid, (counts.get(nid) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nid]) => nid);
  }, [selectedIds]);

  const chooseNode = (nodeId: string) => {
    setStartNodeId(nodeId);
    viewNavigate('/find');
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 border-b border-ink pb-2">
        <div>
          <h1 className="font-block-numeral text-xl uppercase">{t(lang, 'imLost')}</h1>
          <p className="font-mono text-xs text-ink/75 mt-0.5">{t(lang, 'lostTitle')}</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="min-h-11 px-3 border border-ink font-mono text-xs uppercase cursor-pointer"
          >
            {t(lang, 'lostReset')}
          </button>
        )}
      </div>

      {/* Landmark photo tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {LANDMARK_TRIAGE.map((lm) => {
          const picked = selectedIds.includes(lm.id);
          return (
            <button
              key={lm.id}
              type="button"
              onClick={() => toggleLandmark(lm.id)}
              aria-pressed={picked}
              className={`border border-ink text-left flex flex-col cursor-pointer ${
                picked ? 'bg-signal text-ink' : 'bg-paper text-ink'
              }`}
            >
              <div className="relative h-24 w-full border-b border-ink bg-sandstone overflow-hidden">
                <img
                  src={lm.photo}
                  alt={lm.name}
                  className="w-full h-full object-cover"
                />
                {picked && (
                  <span className="absolute top-1.5 right-1.5 bg-ink text-signal p-1">
                    <Check size={14} weight="bold" />
                  </span>
                )}
              </div>
              <div className="p-2">
                <span className="block font-semibold text-xs leading-tight">
                  {lang === 'hi' ? lm.hiName : lm.name}
                </span>
                <span className="block font-mono text-[10px] uppercase text-ink/70 mt-0.5">
                  {lang === 'hi' ? lm.hiArea : lm.area}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Intersection result */}
      {candidateNodeIds.length === 1 && (
        <div className="border border-ink bg-moss text-paper p-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase">{t(lang, 'lostMatched')}</p>
            <p className="font-semibold text-base">
              {lang === 'hi'
                ? nodeMap.get(candidateNodeIds[0])?.label?.hi ?? candidateNodeIds[0]
                : nodeMap.get(candidateNodeIds[0])?.label?.en ?? candidateNodeIds[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => chooseNode(candidateNodeIds[0])}
            className="min-h-12 px-3 border border-ink bg-signal text-ink font-mono text-xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
          >
            <span>{t(lang, 'lostSetStart')}</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {candidateNodeIds.length > 1 && (
        <div className="border border-ink bg-sandstone p-3">
          <p className="font-mono text-xs uppercase mb-2">{t(lang, 'lostCandidates')}</p>
          <div className="divide-y divide-ink border border-ink bg-paper">
            {candidateNodeIds.slice(0, 3).map((nid) => {
              const node = nodeMap.get(nid);
              return (
                <button
                  key={nid}
                  type="button"
                  onClick={() => chooseNode(nid)}
                  className="w-full min-h-12 px-3 py-2 flex items-center justify-between text-left hover:bg-signal cursor-pointer"
                >
                  <span className="font-semibold text-sm">
                    {lang === 'hi' ? node?.label?.hi ?? nid : node?.label?.en ?? nid}
                  </span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
