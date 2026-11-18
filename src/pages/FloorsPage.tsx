import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import { useViewNavigate } from '../components/Shell';
import { LiftIcon, StairsIcon } from '../components/Pictograms';

const FLOORS = [
  { floor: 5, rooms: ['34-501'], noteEn: 'Research Wing', noteHi: 'रिसर्च विंग' },
  { floor: 4, rooms: ['34-401', '34-405', '34-410'], noteEn: 'Computer Labs', noteHi: 'कंप्यूटर लैब' },
  { floor: 3, rooms: ['34-302'], noteEn: 'Lecture Halls', noteHi: 'लेक्चर हॉल' },
  { floor: 2, rooms: ['34-204'], noteEn: 'Seminar Rooms', noteHi: 'सेमिनार कक्ष' },
  { floor: 1, rooms: ['34-102'], noteEn: 'Design Studio', noteHi: 'डिज़ाइन स्टूडियो' },
  { floor: 0, rooms: ['Lobby', 'Restroom'], noteEn: 'Main Entrance', noteHi: 'मुख्य प्रवेश' },
];

export function FloorsPage() {
  const { block = '34' } = useParams();
  const { lang, startNodeId } = useAppStore();
  const viewNavigate = useViewNavigate();
  const [activeFloor, setActiveFloor] = useState(4);

  const selectedFloor = FLOORS.find((f) => f.floor === activeFloor) ?? FLOORS[1];

  const nodeForRoom = (rm: string) => {
    switch (rm) {
      case '34-405': return 'b34.f4.lab405';
      case '34-401': return 'b34.f4.lab401';
      case '34-410': return 'b34.f4.lab410';
      case '34-302': return 'b34.f3.302';
      case '34-204': return 'b34.f2.204';
      case '34-102': return 'b34.f1.102';
      case '34-501': return 'b34.f5.501';
      case 'Restroom': return 'b34.f0.restroom';
      default: return 'b34.f0.lobby';
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-5 pb-8 flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-xl">
          Block {block} — {lang === 'hi' ? 'मंज़िल निर्देशिका' : 'Floor Directory'}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {lang === 'hi'
            ? 'किसी भी मंज़िल पर टैप करें और सीधे कमरे तक रास्ता पाएं।'
            : 'Select a floor to view Stairs A, Lift A, and route to a room.'}
        </p>
      </div>

      {/* Clean Interactive Floor Selector */}
      <div className="flex flex-col gap-2">
        {FLOORS.map((f) => {
          const active = f.floor === activeFloor;
          return (
            <button
              key={f.floor}
              type="button"
              onClick={() => setActiveFloor(f.floor)}
              className="rounded-2xl border p-3.5 flex items-center justify-between text-left cursor-pointer transition-all"
              style={{
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'var(--surface-muted)',
                    color: active ? '#FFFFFF' : 'var(--text)',
                  }}
                >
                  {f.floor === 0 ? 'G' : `F${f.floor}`}
                </span>
                <div>
                  <span className="block font-semibold text-sm">
                    {f.floor === 0 ? t(lang, 'groundFloor') : `${t(lang, 'floorN')} ${f.floor}`}
                  </span>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'hi' ? f.noteHi : f.noteEn}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1">
                  <StairsIcon className="w-3.5 h-3.5" /> A
                </span>
                <span className="inline-flex items-center gap-1">
                  <LiftIcon className="w-3.5 h-3.5" /> A
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Rooms on Selected Floor */}
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          {selectedFloor.floor === 0 ? t(lang, 'groundFloor') : `${t(lang, 'floorN')} ${selectedFloor.floor}`} · Rooms
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedFloor.rooms.map((rm) => (
            <button
              key={rm}
              type="button"
              onClick={() =>
                viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(nodeForRoom(rm))}`)
              }
              className="h-10 px-3.5 rounded-xl text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span>{rm}</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
