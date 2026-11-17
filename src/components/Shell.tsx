import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  MagnifyingGlass,
  MapTrifold,
  Question,
  Stack,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../lib/i18n';
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
  const { lang, setLang, highContrast, toggleHighContrast, hydrate } = useAppStore();
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
    { to: '/map', label: lang === 'hi' ? 'नक्शा' : 'Map', icon: MapTrifold },
    { to: '/floors/34', label: lang === 'hi' ? 'मंज़िलें' : '34 Floors', icon: Stack },
    { to: '/lost', label: lang === 'hi' ? 'खो गए' : 'Lost', icon: Question },
  ];

  return (
    <div className="paper-grain min-h-dvh flex flex-col bg-paper text-ink">
      {/* Top signage bar */}
      <header className="sticky top-0 z-40 border-b border-ink bg-paper px-3 py-2 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-h-12 px-1">
          <span className="inline-flex items-center justify-center bg-brick text-paper font-block-numeral text-sm px-2 py-1 border border-ink">
            34
          </span>
          <span className="font-mono text-xs tracking-wider uppercase font-semibold truncate">
            {t(lang, 'subtitle')}
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {!online && (
            <span className="border border-ink bg-sandstone px-2 py-1 font-mono text-[11px] uppercase">
              {t(lang, 'offlineReady')}
            </span>
          )}
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`min-h-12 px-2.5 border border-ink font-mono text-xs uppercase cursor-pointer ${
              highContrast ? 'bg-ink text-paper' : 'bg-paper text-ink'
            }`}
            title={t(lang, 'highContrast')}
          >
            HC
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="min-h-12 px-3 border border-ink bg-sandstone text-ink font-mono text-xs font-semibold uppercase cursor-pointer"
            aria-label="Switch language"
          >
            {lang === 'en' ? 'हिन्दी' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col pb-20">{children}</main>

      {/* Bottom thumb navigation */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-ink bg-paper grid grid-cols-5"
      >
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? pathname === '/'
              : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`min-h-14 flex flex-col items-center justify-center gap-0.5 border-r last:border-r-0 border-ink text-[11px] font-mono uppercase tracking-tight ${
                active ? 'bg-signal text-ink font-semibold' : 'bg-paper text-ink'
              }`}
            >
              <Icon size={20} weight="bold" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
