import { create } from 'zustand';
import type { Lang } from '../types/wayfinding';
import { loadFavorites, loadRecent, saveFavorites, saveRecent } from '../lib/storage';

interface AppState {
  lang: Lang;
  highContrast: boolean;
  startNodeId: string;
  accessible: boolean;
  voiceEnabled: boolean;
  classStartTime: string; // HH:MM
  favorites: string[];
  recent: string[];
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  toggleHighContrast: () => void;
  setStartNodeId: (nodeId: string) => void;
  toggleAccessible: () => void;
  setVoiceEnabled: (v: boolean) => void;
  setClassStartTime: (time: string) => void;
  toggleFavorite: (placeId: string) => void;
  pushRecent: (placeId: string) => void;
  hydrate: () => Promise<void>;
}

const persistedLang =
  typeof localStorage !== 'undefined' && localStorage.getItem('wb34_lang') === 'hi'
    ? 'hi'
    : 'en';

export const useAppStore = create<AppState>((set, get) => ({
  lang: persistedLang,
  highContrast: false,
  startNodeId: 'gate.main',
  accessible: false,
  voiceEnabled: false,
  classStartTime: '',
  favorites: ['block-34', 'b34-405'],
  recent: ['b34-405', 'central-library', 'uni-mall'],
  hydrated: false,

  setLang: (lang) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wb34_lang', lang);
    }
    set({ lang });
  },

  toggleHighContrast: () => {
    const next = !get().highContrast;
    if (typeof document !== 'undefined') {
      if (next) document.documentElement.setAttribute('data-contrast', 'high');
      else document.documentElement.removeAttribute('data-contrast');
    }
    set({ highContrast: next });
  },

  setStartNodeId: (startNodeId) => set({ startNodeId }),
  toggleAccessible: () => set({ accessible: !get().accessible }),
  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
  setClassStartTime: (classStartTime) => set({ classStartTime }),

  toggleFavorite: (placeId) => {
    const curr = get().favorites;
    const next = curr.includes(placeId)
      ? curr.filter((id) => id !== placeId)
      : [...curr, placeId];
    set({ favorites: next });
    void saveFavorites(next);
  },

  pushRecent: (placeId) => {
    const next = [placeId, ...get().recent.filter((id) => id !== placeId)].slice(0, 6);
    set({ recent: next });
    void saveRecent(next);
  },

  hydrate: async () => {
    if (get().hydrated) return;
    const [favorites, recent] = await Promise.all([loadFavorites(), loadRecent()]);
    set({ favorites, recent, hydrated: true });
  },
}));
