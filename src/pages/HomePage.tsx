import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, ArrowRight, Microphone, Clock } from '@phosphor-icons/react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../lib/i18n';
import { PLACES } from '../data/campusGraph';
import { searchPlaces } from '../lib/search';
import { CategoryPictogram } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';
import { isVoiceSearchSupported, startVoiceSearch } from '../lib/voice';

export function HomePage() {
  const { lang, favorites, recent, startNodeId, setClassStartTime } = useAppStore();
  const viewNavigate = useViewNavigate();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [classTimeInput, setClassTimeInput] = useState('10:00');
  const [parallax, setParallax] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = 40 + (e.clientX / window.innerWidth) * 20;
      const y = 40 + (e.clientY / window.innerHeight) * 20;
      setParallax({ x, y });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const quickHits = query.trim() ? searchPlaces(query).slice(0, 4) : [];

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
    <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-5">
      {/* Hero giant 34 numeral with duotone brick facade clip & parallax */}
      <section className="border border-ink bg-sandstone p-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/80">
            {t(lang, 'subtitle')}
          </p>
          <h1 className="font-block-numeral text-2xl sm:text-3xl leading-tight mt-1 uppercase">
            {t(lang, 'appTitle')}
          </h1>
        </div>
        <div
          aria-hidden="true"
          className="hero-brick-34 font-block-numeral text-[88px] sm:text-[108px] leading-[0.82] select-none shrink-0"
          style={
            {
              '--parallax-x': `${parallax.x}%`,
              '--parallax-y': `${parallax.y}%`,
            } as React.CSSProperties
          }
        >
          34
        </div>
      </section>

      {/* Single primary search field */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex border border-ink bg-paper">
          <span className="flex items-center pl-3 text-ink" aria-hidden="true">
            <MagnifyingGlass size={20} weight="bold" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={listening ? t(lang, 'voiceListening') : t(lang, 'searchPlaceholder')}
            aria-label={t(lang, 'searchPlaceholder')}
            className="w-full min-h-12 px-3 bg-transparent text-ink placeholder:text-ink/50 font-sans text-base focus:outline-none"
          />
          {isVoiceSearchSupported() && (
            <button
              type="button"
              onClick={handleVoice}
              className={`min-w-12 min-h-12 flex items-center justify-center border-l border-ink cursor-pointer ${
                listening ? 'bg-signal text-ink' : 'bg-paper text-ink'
              }`}
              aria-label="Voice search"
            >
              <Microphone size={20} weight="bold" />
            </button>
          )}
          <button
            type="submit"
            className="min-w-12 min-h-12 px-4 border-l border-ink bg-signal text-ink font-mono text-xs font-semibold uppercase cursor-pointer"
          >
            GO
          </button>
        </div>

        {quickHits.length > 0 && (
          <ul className="border-x border-b border-ink bg-paper divide-y divide-ink">
            {quickHits.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() =>
                    viewNavigate(`/go/${encodeURIComponent(startNodeId)}/${encodeURIComponent(p.node)}`)
                  }
                  className="w-full min-h-12 px-3 py-2 flex items-center justify-between text-left hover:bg-sandstone cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <CategoryPictogram category={p.category} />
                    <span className="font-semibold text-sm">
                      {lang === 'hi' && p.hiName ? p.hiName : p.names[0]}
                    </span>
                  </span>
                  {p.room && (
                    <span className="font-mono text-xs border border-ink px-1.5 py-0.5 bg-sandstone">
                      {p.block}-{p.room}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Three quick actions */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Link
          to="/find"
          className="min-h-14 border border-ink bg-paper px-3 py-3 flex items-center justify-between font-semibold text-sm hover:bg-sandstone"
        >
          <span>{t(lang, 'findBlock')}</span>
          <ArrowRight size={18} weight="bold" />
        </Link>

        <Link
          to="/lost"
          className="min-h-14 border border-ink bg-brick text-paper px-3 py-3 flex items-center justify-between font-semibold text-sm"
        >
          <span>{t(lang, 'imLost')}</span>
          <ArrowRight size={18} weight="bold" />
        </Link>

        <div className="border border-ink bg-sandstone p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock size={18} weight="bold" />
            <input
              type="time"
              value={classTimeInput}
              onChange={(e) => setClassTimeInput(e.target.value)}
              aria-label={t(lang, 'classTimeLabel')}
              className="font-mono text-xs border border-ink bg-paper px-1.5 py-1 min-h-9"
            />
          </div>
          <button
            type="button"
            onClick={handleMakeClass}
            className="min-h-10 px-2.5 border border-ink bg-signal text-ink font-mono text-xs font-semibold uppercase cursor-pointer"
          >
            {t(lang, 'makeClass')}
          </button>
        </div>
      </section>

      {/* Recent + Saved places */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-wider mb-2 border-b border-ink pb-1">
          {t(lang, 'recentPlaces')}
        </h2>
        <div className="border border-ink divide-y divide-ink bg-paper">
          {savedPlaces.map((p) => (
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
                    <span className="block font-mono text-[11px] text-ink/70">
                      {p.hours}
                    </span>
                  )}
                </span>
              </span>
              <ArrowRight size={16} weight="bold" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
