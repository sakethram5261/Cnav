import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CaretLeft,
  CaretRight,
  Flag,
  ArrowsClockwise,
  Check,
} from '@phosphor-icons/react';
import { LpuLeafletMap } from '../components/LpuLeafletMap';
import { computeRoute, findNearestOutdoorNode, formatDuration, getNode } from '../lib/routing';
import { PLACES } from '../data/campusGraph';
import { t } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';
import { isSpeechSynthesisSupported, speakText, stopSpeaking } from '../lib/voice';
import { queueReport } from '../lib/storage';
import { AccessibleIcon, LiftIcon, StairsIcon, VoiceIcon } from '../components/Pictograms';
import { useViewNavigate } from '../components/Shell';

export function NavigatePage() {
  const { from = 'gate.main', to = 'b34.f4.lab405' } = useParams();
  const decodedFrom = decodeURIComponent(from);
  const decodedTo = decodeURIComponent(to);

  const {
    lang,
    accessible,
    toggleAccessible,
    voiceEnabled,
    setVoiceEnabled,
    classStartTime,
    setStartNodeId,
  } = useAppStore();
  const viewNavigate = useViewNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const route = useMemo(
    () => computeRoute(decodedFrom, decodedTo, { accessible, now }),
    [decodedFrom, decodedTo, accessible, now]
  );

  const destPlace = useMemo(
    () => PLACES.find((p) => p.node === decodedTo),
    [decodedTo]
  );

  const currentStep = route?.steps[activeStep];

  useEffect(() => {
    if (!voiceEnabled || !currentStep) return;
    const text = lang === 'hi' ? currentStep.instruction.hi : currentStep.instruction.en;
    speakText(text, lang);
  }, [activeStep, voiceEnabled, currentStep, lang]);

  useEffect(() => () => stopSpeaking(), []);

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next && currentStep) {
      const text = lang === 'hi' ? currentStep.instruction.hi : currentStep.instruction.en;
      speakText(text, lang);
    } else {
      stopSpeaking();
    }
  };

  const handleArrive = () => {
    setArrived(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleOffRoute = () => {
    const currNode = currentStep ? getNode(currentStep.fromNode) : getNode(decodedFrom);
    if (!currNode) return;
    const nearest = findNearestOutdoorNode(currNode.x + 12, currNode.y + 8);
    setStartNodeId(nearest.id);
    setActiveStep(0);
    viewNavigate(`/go/${encodeURIComponent(nearest.id)}/${encodeURIComponent(decodedTo)}`);
  };

  const handleReport = async () => {
    const nodeId = currentStep?.fromNode ?? decodedFrom;
    const { synced } = await queueReport({
      id: `${Date.now()}`,
      nodeId,
      note: `Flagged during route ${decodedFrom} -> ${decodedTo}`,
      createdAt: new Date().toISOString(),
    });
    setReportNotice(synced ? t(lang, 'reportSent') : t(lang, 'reportSavedOffline'));
    setTimeout(() => setReportNotice(null), 4000);
  };

  const classTimer = useMemo(() => {
    if (!classStartTime || !route) return null;
    const [hh, mm] = classStartTime.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    const leaveByMs = target.getTime() - route.totalSeconds * 1000;
    const leaveBy = new Date(leaveByMs);
    const leaveStr = `${String(leaveBy.getHours()).padStart(2, '0')}:${String(
      leaveBy.getMinutes()
    ).padStart(2, '0')}`;
    const remainingSec = (target.getTime() - now.getTime()) / 1000;
    const isLate = route.totalSeconds > remainingSec;
    return { leaveStr, isLate };
  }, [classStartTime, route, now]);

  const goStep = (idx: number) => {
    if (!route) return;
    const clamped = Math.max(0, Math.min(route.steps.length - 1, idx));
    setActiveStep(clamped);
    const el = carouselRef.current?.children[clamped] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || !route) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 300;
    const idx = Math.round(el.scrollLeft / (cardWidth + 12));
    if (idx >= 0 && idx < route.steps.length && idx !== activeStep) {
      setActiveStep(idx);
    }
  };

  if (!route) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <p className="rounded-2xl border p-4 text-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          No route found between {decodedFrom} and {decodedTo}.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Route Summary Header */}
      <div
        className="shrink-0 z-20 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold text-sm truncate">
            {destPlace
              ? lang === 'hi' && destPlace.hiName
                ? destPlace.hiName
                : destPlace.names[0]
              : decodedTo}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            {formatDuration(route.totalSeconds, lang)} · {route.totalMeters} m
          </span>
        </div>

        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
          style={{
            backgroundColor: route.allVerified ? 'var(--verified)' : 'var(--warning)',
          }}
        >
          {route.allVerified
            ? `${t(lang, 'verifiedChip')}`
            : t(lang, 'unverifiedChip')}
        </span>
      </div>

      {classTimer && (
        <div
          className="shrink-0 z-20 border-b px-4 py-1.5 flex items-center justify-between text-xs font-medium"
          style={{
            backgroundColor: classTimer.isLate ? 'rgba(217, 119, 6, 0.16)' : 'var(--surface-muted)',
            borderColor: 'var(--border)',
          }}
        >
          <span>
            {t(lang, 'leaveBy')} <strong>{classTimer.leaveStr}</strong>
          </span>
          <span>{classTimer.isLate ? t(lang, 'lateWarning') : t(lang, 'onTime')}</span>
        </div>
      )}

      {/* Exact LPU Leaflet Map */}
      <div className="flex-1 min-h-0 relative">
        <LpuLeafletMap
          route={route}
          activeStepIndex={activeStep}
          youNodeId={currentStep?.fromNode ?? decodedFrom}
          lang={lang}
        />

        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[500]">
          <button
            type="button"
            onClick={toggleAccessible}
            aria-pressed={accessible}
            className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold border cursor-pointer"
            style={{
              backgroundColor: accessible ? 'var(--accent)' : 'var(--surface)',
              color: accessible ? '#FFFFFF' : 'var(--text)',
              borderColor: 'var(--border)',
            }}
          >
            <AccessibleIcon className="w-4 h-4" />
            <span>{t(lang, 'accessibleRoute')}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            aria-pressed={voiceEnabled}
            className="h-9 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold border cursor-pointer"
            style={{
              backgroundColor: voiceEnabled ? 'var(--accent)' : 'var(--surface)',
              color: voiceEnabled ? '#FFFFFF' : 'var(--text)',
              borderColor: 'var(--border)',
            }}
          >
            <VoiceIcon className="w-4 h-4" />
            <span>{voiceEnabled ? t(lang, 'voiceOn') : t(lang, 'voiceOff')}</span>
          </button>
        </div>
      </div>

      {/* Turn-by-turn Bottom Sheet */}
      <section
        aria-label="Turn-by-turn directions"
        className="shrink-0 z-[500] border-t flex flex-col"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {!isSpeechSynthesisSupported() && voiceEnabled && (
          <p
            className="px-4 py-1.5 text-xs border-b"
            style={{ backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)' }}
          >
            {t(lang, 'voiceUnavailable')}
          </p>
        )}

        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          aria-live="polite"
          className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-3 p-3"
        >
          {route.steps.map((step, idx) => {
            const active = idx === activeStep;
            return (
              <article
                key={step.id}
                onClick={() => goStep(idx)}
                className="snap-start shrink-0 w-[84%] sm:w-[320px] rounded-2xl border p-3.5 flex flex-col justify-between cursor-pointer transition-all"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                    Step {idx + 1} of {route.steps.length}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    {step.kind === 'stairs' && <StairsIcon className="w-4 h-4" />}
                    {step.kind === 'lift' && <LiftIcon className="w-4 h-4" />}
                    {step.meters > 0 && `${step.meters} m`}
                  </span>
                </div>

                <p className="font-semibold text-sm leading-snug my-2">
                  {lang === 'hi' ? step.instruction.hi : step.instruction.en}
                </p>

                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {step.floorFrom === 0 ? 'Ground' : `Floor ${step.floorFrom}`}
                    {step.floorTo !== step.floorFrom ? ` → Floor ${step.floorTo}` : ''}
                  </span>
                  {step.floorTo > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewNavigate('/floors/34');
                      }}
                      className="font-semibold underline cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {t(lang, 'floorGuide')} →
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="border-t px-3 py-2 flex items-center justify-between gap-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goStep(activeStep - 1)}
              disabled={activeStep === 0}
              className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-35 cursor-pointer"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
              aria-label={t(lang, 'prevStep')}
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => goStep(activeStep + 1)}
              disabled={activeStep === route.steps.length - 1}
              className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-35 cursor-pointer"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
              aria-label={t(lang, 'nextStep')}
            >
              <CaretRight size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleOffRoute}
              className="h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <ArrowsClockwise size={15} weight="bold" />
              <span>{t(lang, 'offRoute')}</span>
            </button>
            <button
              type="button"
              onClick={handleReport}
              className="w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
              title={t(lang, 'reportWrong')}
              aria-label={t(lang, 'reportWrong')}
            >
              <Flag size={15} weight="bold" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleArrive}
            className="h-10 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'var(--verified)' }}
          >
            <Check size={16} weight="bold" />
            <span>{t(lang, 'arrivedBtn')}</span>
          </button>
        </div>

        {reportNotice && (
          <p className="px-4 py-1.5 text-xs border-t" style={{ borderColor: 'var(--border)' }}>
            {reportNotice}
          </p>
        )}
      </section>

      {arrived && (
        <div
          className="fixed inset-0 z-[600] bg-black/50 flex items-center justify-center p-6"
          onClick={() => setArrived(false)}
        >
          <div
            className="rounded-3xl border p-7 text-center shadow-xl max-w-xs w-full"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--verified)' }}
            >
              <Check size={24} weight="bold" />
            </div>
            <p className="font-display font-bold text-2xl">{t(lang, 'arrivedStamp')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {destPlace ? destPlace.names[0] : decodedTo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
