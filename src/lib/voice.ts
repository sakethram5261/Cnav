import type { Lang } from '../types/wayfinding';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(text: string, lang: Lang): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) =>
      v.lang.toLowerCase().startsWith(lang === 'hi' ? 'hi' : 'en-in')
    );
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function isVoiceSearchSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startVoiceSearch(
  lang: Lang,
  onTranscript: (text: string) => void,
  onEnd: () => void
): () => void {
  const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const transcript = e.results?.[0]?.[0]?.transcript ?? '';
    if (transcript) onTranscript(transcript);
  };
  rec.onerror = () => onEnd();
  rec.onend = () => onEnd();
  rec.start();
  return () => {
    try {
      rec.stop();
    } catch {
      // ignore
    }
  };
}
