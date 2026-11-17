import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getNode } from '../lib/routing';
import { useAppStore } from '../store/useAppStore';
import { YouAreHereIcon } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

export function QrEntryPage() {
  const { nodeId = 'b34.f0.lobby' } = useParams();
  const decoded = decodeURIComponent(nodeId);
  const node = getNode(decoded);
  const { lang, setStartNodeId } = useAppStore();
  const viewNavigate = useViewNavigate();

  useEffect(() => {
    if (node) {
      setStartNodeId(node.id);
    }
  }, [node, setStartNodeId]);

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-8 pb-8 flex flex-col gap-4">
      <div className="border-2 border-ink bg-signal p-4 flex items-center gap-3">
        <YouAreHereIcon className="w-8 h-8 shrink-0" />
        <div>
          <p className="font-mono text-xs uppercase font-semibold">QR ANCHOR SCANNED</p>
          <h1 className="font-block-numeral text-xl uppercase">
            {node ? (lang === 'hi' ? node.label?.hi ?? node.id : node.label?.en ?? node.id) : decoded}
          </h1>
        </div>
      </div>

      <p className="font-mono text-xs text-ink/80">
        Start location locked indoors with zero GPS. Choose where you want to go:
      </p>

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => viewNavigate(`/go/${encodeURIComponent(node?.id ?? 'b34.f0.lobby')}/b34.f4.lab405`)}
          className="min-h-12 px-4 border border-ink bg-brick text-paper font-mono text-xs font-semibold uppercase text-left cursor-pointer"
        >
          Route to Lab 34-405 (Floor 4) →
        </button>
        <button
          type="button"
          onClick={() => viewNavigate('/find')}
          className="min-h-12 px-4 border border-ink bg-paper text-ink font-mono text-xs font-semibold uppercase text-left cursor-pointer"
        >
          Pick another destination →
        </button>
      </div>
    </div>
  );
}
