import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Crosshair,
  MagnifyingGlass,
  MapPin,
  Microphone,
  Question,
  Buildings,
} from '@phosphor-icons/react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../lib/i18n';
import { PLACES } from '../data/campusGraph';
import { searchPlaces } from '../lib/search';
import { detectCurrentBlock } from '../lib/geo';
import {
  computeRoute,
  formatDuration,
  getNode,
  isClassChangeWindow,
} from '../lib/routing';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';
import { isVoiceSearchSupported, startVoiceSearch } from '../lib/voice';

export function HomePage() {
  const { lang, favorites, recent, startNodeId, setStartNodeId, setClassStartTime } =
    useAppStore();
  const viewNavigate = useViewNavigate();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  const [classTimeInput, setClassTimeInput] = useState(() => {
    const d = new Date(Date.now() + 15 * 60000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const handleUseMyLocation = async () => {
    setLocating(true);
    setLocNote(null);
    const res = await detectCurrentBlock();
    setLocating(false);
    if (res.ok) {
      setStartNodeId(res.node.id);
      const name = lang === 'hi' ? res.node.label?.hi ?? res.node.id : res.node.label?.en ?? res.node.id;
      setLocNote(
        res.offCampus
          ? `Off-campus (${Math.round(res.distanceMeters / 1000)} km away) — nearest: ${name}`
          : `Detected near ${name} (${res.distanceMeters} m)`
      );
    } else {
      setLocNote(res.message);
    }
  };

  const currentStartNode = getNode(startNodeId);

  const quickHits = query.trim() ? searchPlaces(query).slice(0, 5) : [];
  const crowdNow = isClassChangeWindow();
  const b34Route = useMemo(
    () => computeRoute(startNodeId, 'b34.f4.lab405', { crowdActive: crowdNow }),
    [startNodeId, crowdNow]
  );

  const classPreview = useMemo(() => {
    if (!b34Route || !classTimeInput) return null;
    const [hh, mm] = classTimeInput.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const now = new Date();
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    const remainingSec = (target.getTime() - now.getTime()) / 1000;
    const leaveBy = new Date(target.getTime() - b34Route.totalSeconds * 1000);
    const leaveStr = `${String(leaveBy.getHours()).padStart(2, '0')}:${String(
      leaveBy.getMinutes()
    ).padStart(2, '0')}`;
    return {
      leaveStr,
      isLate: b34Route.totalSeconds > remainingSec,
      pct: Math.max(0.1, Math.min(1, b34Route.totalSeconds / Math.max(60, remainingSec))),
    };
  }, [b34Route, classTimeInput]);

  const savedPlaces = Array.from(new Set([...favorites, ...recent]))
    .map((id) => PLACES.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 5);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickHits.length > 0) {
      viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(quickHits[0].node)}`);
    } else {
      viewNavigate(`/find?q=${encodeURIComponent(query)}`);
    }
  };

  const handleVoice = () => {
    if (!isVoiceSearchSupported()) return;
    setListening(true);
    startVoiceSearch(
      lang,
      (text) => {
        setQuery(text);
        setListening(false);
      },
      () => setListening(false)
    );
  };

  const handleMakeClass = () => {
    setClassStartTime(classTimeInput);
    viewNavigate(`/go/${encodeURIComponent(startNodeId)}/b34.f4.lab405`);
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-5 pb-8 flex flex-col gap-5">
      {/* Clean Hero Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: crowdNow ? 'rgba(217, 119, 6, 0.14)' : 'var(--accent-soft)',
              color: crowdNow ? 'var(--warning)' : 'var(--accent)',
            }}
          >
            {crowdNow ? t(lang, 'crowdWindow') : 'Lovely Professional University'}
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
          {lang === 'hi' ? 'कैंपस में कहाँ जाना है?' : 'Where on campus?'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {lang === 'hi'
            ? 'कोई भी ब्लॉक, कमरा (34-405), लैब या गेट खोजें।'
            : 'Search any block (1–58), room like 34-405, library, or canteen.'}
        </p>

        {/* Current Start Location / GPS Prompt */}
        <div
          className="mt-2 rounded-xl border px-3 py-2 flex items-center justify-between gap-2 text-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span className="truncate">
            <span style={{ color: 'var(--text-muted)' }}>Starting from: </span>
            <strong>
              {lang === 'hi'
                ? currentStartNode?.label?.hi ?? startNodeId
                : currentStartNode?.label?.en ?? startNodeId}
            </strong>
          </span>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="inline-flex items-center gap-1 font-semibold shrink-0 cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <Crosshair size={14} weight="bold" />
            <span>{locating ? 'Locating…' : 'Use GPS'}</span>
          </button>
        </div>
        {locNote && (
          <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            {locNote}
          </p>
        )}
      </section>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div
          className="flex items-center rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span className="pl-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true">
            <MagnifyingGlass size={20} weight="bold" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={listening ? t(lang, 'voiceListening') : t(lang, 'searchPlaceholder')}
            aria-label={t(lang, 'searchPlaceholder')}
            className="w-full h-13 px-3 bg-transparent text-base focus:outline-none"
          />
          {isVoiceSearchSupported() && (
            <button
              type="button"
              onClick={handleVoice}
              className="w-11 h-11 mr-1 rounded-xl flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: listening ? 'var(--accent-soft)' : 'transparent',
                color: listening ? 'var(--accent)' : 'var(--text-muted)',
              }}
              aria-label="Voice search"
            >
              <Microphone size={19} weight="bold" />
            </button>
          )}
          <button
            type="submit"
            className="h-10 px-4 mr-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Go
          </button>
        </div>

        {quickHits.length > 0 && (
          <ul
            className="mt-2 rounded-2xl border shadow-md overflow-hidden divide-y"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {quickHits.map((p) => (
              <li key={p.id} style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() =>
                    viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(p.node)}`)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:opacity-80 cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <CategoryPictogram category={p.category} className="w-5 h-5" />
                    <span className="font-medium text-sm">
                      {lang === 'hi' && p.hiName ? p.hiName : p.names[0]}
                    </span>
                  </span>
                  {p.room && (
                    <span
                      className="font-mono-code text-xs px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: 'var(--surface-muted)' }}
                    >
                      {p.block}-{p.room}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/map"
          className="rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <MapPin size={22} weight="fill" />
          </span>
          <div>
            <span className="block font-semibold text-sm">{t(lang, 'campusMap')}</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Street &amp; Satellite
            </span>
          </div>
        </Link>

        <Link
          to="/find"
          className="rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}
          >
            <MagnifyingGlass size={22} weight="bold" />
          </span>
          <div>
            <span className="block font-semibold text-sm">{t(lang, 'findBlock')}</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              All Blocks 1–58
            </span>
          </div>
        </Link>

        <Link
          to="/floors/34"
          className="rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}
          >
            <Buildings size={22} weight="bold" />
          </span>
          <div>
            <span className="block font-semibold text-sm">{t(lang, 'floorGuide')}</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ground – Floor 5
            </span>
          </div>
        </Link>

        <Link
          to="/lost"
          className="rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.14)', color: 'var(--warning)' }}
          >
            <Question size={22} weight="bold" />
          </span>
          <div>
            <span className="block font-semibold text-sm">{t(lang, 'imLost')}</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Landmark finder
            </span>
          </div>
        </Link>
      </section>

      {/* Make It To Class Timer */}
      <section
        className="rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-muted)" strokeWidth="4.5" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={classPreview?.isLate ? 'var(--warning)' : 'var(--verified)'}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={113}
              strokeDashoffset={113 * (1 - (classPreview?.pct ?? 0.5))}
            />
          </svg>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={14} weight="bold" />
              <span>{t(lang, 'classTimeLabel')}</span>
              <input
                type="time"
                value={classTimeInput}
                onChange={(e) => setClassTimeInput(e.target.value)}
                aria-label={t(lang, 'classTimeLabel')}
                className="font-mono-code text-xs rounded-lg px-2 py-0.5 border"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <p className="font-semibold text-sm mt-1 truncate">
              {classPreview
                ? `${t(lang, 'leaveBy')} ${classPreview.leaveStr} · ${
                    b34Route ? formatDuration(b34Route.totalSeconds, lang) : ''
                  }`
                : t(lang, 'makeClass')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMakeClass}
          className="h-10 px-3.5 rounded-xl text-white text-xs font-semibold shrink-0 cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Route
        </button>
      </section>

      {/* Recent & Saved */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {t(lang, 'recentPlaces')}
        </h2>
        <div
          className="rounded-2xl border shadow-sm divide-y overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {savedPlaces.map((p) => (
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
                  {p.hours && (
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.hours}
                    </span>
                  )}
                </span>
              </span>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
