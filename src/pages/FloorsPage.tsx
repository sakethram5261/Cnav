import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import { useViewNavigate } from '../components/Shell';

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
  const [exploded, setExploded] = useState(true);
  const [activeFloor, setActiveFloor] = useState(4);

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-ink pb-2">
        <div>
          <h1 className="font-block-numeral text-xl uppercase">
            {t(lang, 'floorsTitle')} ({block})
          </h1>
          <p className="font-mono text-xs text-ink/75">{t(lang, 'floorsHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => setExploded((v) => !v)}
          className="min-h-11 px-3 border border-ink bg-sandstone font-mono text-xs uppercase cursor-pointer"
        >
          {exploded ? 'Stack' : 'Explode'}
        </button>
      </div>

      <div className="border border-ink bg-paper p-3 flex items-center gap-3">
        <label htmlFor="floor-scrub" className="font-mono text-xs uppercase shrink-0">
          {activeFloor === 0 ? t(lang, 'groundFloor') : `${t(lang, 'floorN')} ${activeFloor}`}
        </label>
        <input
          id="floor-scrub"
          type="range"
          min={0}
          max={5}
          step={1}
          value={activeFloor}
          onChange={(e) => setActiveFloor(Number(e.target.value))}
          className="w-full accent-brick"
        />
      </div>

      <div
        className="relative flex flex-col items-center py-6 overflow-hidden border border-ink bg-sandstone"
        style={{ perspective: '1200px' }}
        onClick={() => setExploded((v) => !v)}
      >
        <div className="flex flex-col items-center w-full max-w-xs">
          {FLOORS.map((f) => {
            const isActive = f.floor === activeFloor;
            const gapPx = exploded ? 14 : -34;
            return (
              <div
                key={f.floor}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFloor(f.floor);
                }}
                style={{
                  transform: `rotateX(52deg) rotateZ(-14deg) translateZ(${isActive ? 18 : 0}px)`,
                  marginBottom: `${gapPx}px`,
                }}
                className={`w-64 h-24 border-2 border-ink p-2.5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isActive ? 'bg-signal text-ink' : 'bg-paper text-ink'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs font-semibold">
                  <span>{f.floor === 0 ? 'G / F0' : `F${f.floor}`}</span>
                  <span>{lang === 'hi' ? f.noteHi : f.noteEn}</span>
                </div>

                <svg viewBox="0 0 200 40" className="w-full h-8">
                  <rect x="2" y="2" width="196" height="36" fill="none" stroke="var(--ink)" strokeWidth="1" />
                  <rect x="12" y="8" width="22" height="24" fill="var(--brick)" />
                  <text x="23" y="23" textAnchor="middle" fontSize="8" fill="var(--paper)" fontFamily="monospace">
                    ST
                  </text>
                  <rect x="42" y="8" width="22" height="24" fill="var(--ink)" />
                  <text x="53" y="23" textAnchor="middle" fontSize="8" fill="var(--paper)" fontFamily="monospace">
                    LF
                  </text>
                  <path
                    d="M 34 20 L 175 20"
                    stroke={isActive ? 'var(--ink)' : 'var(--signal)'}
                    strokeWidth="3"
                  />
                  {isActive && (
                    <circle cx="110" cy="20" r="6" fill="var(--ink)" stroke="var(--paper)" strokeWidth="2" />
                  )}
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-ink bg-paper p-3">
        <p className="font-mono text-xs uppercase mb-2">
          {activeFloor === 0 ? t(lang, 'groundFloor') : `${t(lang, 'floorN')} ${activeFloor}`} — Block 34
        </p>
        <div className="flex flex-wrap gap-2">
          {FLOORS.find((f) => f.floor === activeFloor)?.rooms.map((rm) => {
            const targetNode =
              rm === '34-405'
                ? 'b34.f4.lab405'
                : rm === '34-401'
                ? 'b34.f4.lab401'
                : rm === '34-410'
                ? 'b34.f4.lab410'
                : rm === '34-302'
                ? 'b34.f3.302'
                : rm === '34-204'
                ? 'b34.f2.204'
                : rm === '34-102'
                ? 'b34.f1.102'
                : rm === '34-501'
                ? 'b34.f5.501'
                : rm === 'Restroom'
                ? 'b34.f0.restroom'
                : 'b34.f0.lobby';
            return (
              <button
                key={rm}
                type="button"
                onClick={() =>
                  viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(targetNode)}`)
                }
                className="min-h-11 px-3 border border-ink bg-sandstone font-mono text-xs font-semibold hover:bg-signal cursor-pointer"
              >
                {rm}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
