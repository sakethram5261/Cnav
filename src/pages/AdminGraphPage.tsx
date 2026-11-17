import { useState } from 'react';
import { GRAPH_EDGES, GRAPH_NODES } from '../data/campusGraph';

export function AdminGraphPage() {
  const [edges, setEdges] = useState(GRAPH_EDGES);

  const toggleVerified = (idx: number) => {
    setEdges((curr) =>
      curr.map((e, i) =>
        i === idx
          ? {
              ...e,
              verified: !e.verified,
              verifiedOn: !e.verified ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : e
      )
    );
  };

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
      <div className="border-b border-ink pb-2">
        <h1 className="font-block-numeral text-xl uppercase">Dev Graph Editor</h1>
        <p className="font-mono text-xs text-ink/75">
          {GRAPH_NODES.length} nodes · {edges.length} edges
        </p>
      </div>

      <div className="border border-ink bg-paper divide-y divide-ink">
        {edges.map((e, idx) => (
          <div key={`${e.a}-${e.b}`} className="p-2.5 flex items-center justify-between gap-2 font-mono text-xs">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {e.a} → {e.b} ({e.meters}m)
              </p>
              {e.landmark && <p className="text-ink/70 truncate">{e.landmark.en}</p>}
            </div>
            <button
              type="button"
              onClick={() => toggleVerified(idx)}
              className={`min-h-10 px-2.5 border border-ink uppercase shrink-0 cursor-pointer ${
                e.verified ? 'bg-moss text-paper' : 'bg-signal text-ink'
              }`}
            >
              {e.verified ? 'Verified' : 'Unverified'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
