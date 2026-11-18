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
    <div className="max-w-xl w-full mx-auto px-4 pt-5 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-bold text-xl">{t(lang, 'imLost')}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {t(lang, 'lostTitle')} ({selectedIds.length}/3)
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="h-9 px-3 rounded-full border text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {t(lang, 'lostReset')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LANDMARK_TRIAGE.map((lm) => {
          const picked = selectedIds.includes(lm.id);
          return (
            <button
              key={lm.id}
              type="button"
              onClick={() => toggleLandmark(lm.id)}
              aria-pressed={picked}
              className="rounded-2xl border overflow-hidden text-left flex flex-col cursor-pointer shadow-sm transition-all"
              style={{
                backgroundColor: picked ? 'var(--accent-soft)' : 'var(--surface)',
                borderColor: picked ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="relative h-24 w-full overflow-hidden" style={{ backgroundColor: 'var(--surface-muted)' }}>
                <img
                  src={lm.photo}
                  alt={lm.name}
                  className="w-full h-full object-cover"
                />
                {picked && (
                  <span
                    className="absolute top-2 right-2 w-6 h-6 rounded-full text-white flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Check size={13} weight="bold" />
                  </span>
                )}
              </div>
              <div className="p-3">
                <span className="block font-semibold text-xs leading-snug">
                  {lang === 'hi' ? lm.hiName : lm.name}
                </span>
                <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? lm.hiArea : lm.area}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {candidateNodeIds.length === 1 && (
        <div
          className="rounded-2xl p-4 text-white flex items-center justify-between gap-3 shadow-sm"
          style={{ backgroundColor: 'var(--verified)' }}
        >
          <div>
            <p className="text-[11px] uppercase opacity-90">{t(lang, 'lostMatched')}</p>
            <p className="font-semibold text-base">
              {lang === 'hi'
                ? nodeMap.get(candidateNodeIds[0])?.label?.hi ?? candidateNodeIds[0]
                : nodeMap.get(candidateNodeIds[0])?.label?.en ?? candidateNodeIds[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => chooseNode(candidateNodeIds[0])}
            className="h-10 px-3.5 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{t(lang, 'lostSetStart')}</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {candidateNodeIds.length > 1 && (
        <div
          className="rounded-2xl border p-4 shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            {t(lang, 'lostCandidates')}
          </p>
          <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {candidateNodeIds.slice(0, 3).map((nid) => {
              const node = nodeMap.get(nid);
              return (
                <button
                  key={nid}
                  type="button"
                  onClick={() => chooseNode(nid)}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:opacity-80 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="font-medium text-sm">
                    {lang === 'hi' ? node?.label?.hi ?? nid : node?.label?.en ?? nid}
                  </span>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
