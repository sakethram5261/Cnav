import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  MagnifyingGlass,
  MapPin,
  Moon,
  Question,
  Buildings,
  Sun,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { flushQueuedReports } from '../lib/storage';

export function useViewNavigate() {
  const navigate = useNavigate();
  return (to: string) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !prefersReduced) {
      doc.startViewTransition(() => navigate(to));
    } else {
      navigate(to);
    }
  };
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { lang, setLang, theme, toggleTheme, hydrate } = useAppStore();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    void hydrate();
    const onOnline = () => {
      setOnline(true);
      void flushQueuedReports();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [hydrate]);

  const navItems = [
    { to: '/', label: lang === 'hi' ? 'होम' : 'Home', icon: Compass },
    { to: '/find', label: lang === 'hi' ? 'खोजें' : 'Find', icon: MagnifyingGlass },
    { to: '/map', label: lang === 'hi' ? 'नक्शा' : 'Map', icon: MapPin },
    { to: '/floors/34', label: lang === 'hi' ? 'मंज़िलें' : 'Floors', icon: Buildings },
    { to: '/lost', label: lang === 'hi' ? 'खो गए' : 'Lost', icon: Question },
  ];

  return (
    <div
      className="h-dvh w-full overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* LPU campus guide masthead */}
      <header
        className="shrink-0 z-40 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 min-h-10">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-xs leading-none text-center border-2"
            style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--gold)' }}
          >
            LPU
          </span>
          <div className="leading-tight">
            <span className="block font-display font-bold text-[15px] tracking-tight uppercase">
              {lang === 'hi' ? 'एलपीयू कैंपस गाइड' : 'LPU Campus Guide'}
            </span>
            <span
              className="block text-[10px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {lang === 'hi' ? 'ब्लॉक · मार्ग · स्थल योजना' : 'Blocks · routes · site plan'}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!online && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}
            >
              Offline
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
          >
            {theme === 'dark' ? <Sun size={17} weight="bold" /> : <Moon size={17} weight="bold" />}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="h-9 px-3 rounded-full text-xs font-semibold border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
          >
            {lang === 'en' ? 'हिन्दी' : 'EN'}
          </button>
        </div>
        </div>
        <div className="lpu-rule" aria-hidden="true" />
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto relative flex flex-col">
        {children}
      </main>

      {/* Primary navigation */}
      <nav
        aria-label="Primary"
        className="shrink-0 z-40 border-t grid grid-cols-5 px-2 py-1.5 md:flex md:justify-center md:gap-2 md:px-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {navItems.map((item) => {
          const active =
            item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors md:flex-row md:gap-2 md:text-xs"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
