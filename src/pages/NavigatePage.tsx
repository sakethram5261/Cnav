import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CaretLeft,
  CaretRight,
  Flag,
  ArrowsClockwise,
  Check,
} from '@phosphor-icons/react';
import { CampusMapSvg } from '../components/CampusMapSvg';
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
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'half' | 'full'>('half');
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

  if (!route) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <p className="border border-ink bg-paper p-4 font-mono text-sm">
          No route found between {decodedFrom} and {decodedTo}.
        </p>
      </div>
    );
  }

  const sheetHeightClass =
    sheetSnap === 'peek' ? 'h-36' : sheetSnap === 'full' ? 'h-[68dvh]' : 'h-[44dvh]';

  const bottomInset = sheetSnap === 'peek' ? 140 : sheetSnap === 'full' ? 420 : 280;

  return (
    <div className="relative flex-1 flex flex-col h-[calc(100dvh-7.5rem)] overflow-hidden">
      <div className="z-20 border-b border-ink bg-paper px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-block-numeral text-base uppercase truncate"
            style={
              destPlace
                ? ({ viewTransitionName: `place-${destPlace.id}` } as React.CSSProperties)
                : undefined
            }
          >
            {destPlace
              ? lang === 'hi' && destPlace.hiName
                ? destPlace.hiName
                : destPlace.names[0]
              : decodedTo}
          </span>
          <span className="font-mono text-xs border border-ink bg-sandstone px-1.5 py-0.5">
            {formatDuration(route.totalSeconds, lang)} · {route.totalMeters} m
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono text-[11px] uppercase px-2 py-0.5 border border-ink ${
              route.allVerified ? 'bg-moss text-paper' : 'bg-signal text-ink'
            }`}
          >
            {route.allVerified
              ? `${t(lang, 'verifiedChip')} ${route.oldestVerifiedOn ?? ''}`
              : t(lang, 'unverifiedChip')}
          </span>
        </div>
      </div>

      {classTimer && (
        <div
          className={`z-20 border-b border-ink px-3 py-1.5 flex items-center justify-between font-mono text-xs ${
            classTimer.isLate ? 'bg-signal text-ink font-semibold' : 'bg-sandstone text-ink'
          }`}
        >
          <span>
            {t(lang, 'leaveBy')} {classTimer.leaveStr}
          </span>
          <span>{classTimer.isLate ? t(lang, 'lateWarning') : t(lang, 'onTime')}</span>
        </div>
      )}

      <div className="flex-1 relative">
        <CampusMapSvg
          route={route}
          activeStepIndex={activeStep}
          youNodeId={currentStep?.fromNode ?? decodedFrom}
          lang={lang}
          bottomInsetPx={bottomInset}
        />

        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={toggleAccessible}
            aria-pressed={accessible}
            className={`min-h-11 px-2.5 border border-ink flex items-center gap-1.5 font-mono text-[11px] uppercase cursor-pointer ${
              accessible ? 'bg-signal text-ink font-semibold' : 'bg-paper text-ink'
            }`}
          >
            <AccessibleIcon className="w-4 h-4" />
            <span>{t(lang, 'accessibleRoute')}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            aria-pressed={voiceEnabled}
            className={`min-h-11 px-2.5 border border-ink flex items-center gap-1.5 font-mono text-[11px] uppercase cursor-pointer ${
              voiceEnabled ? 'bg-signal text-ink font-semibold' : 'bg-paper text-ink'
            }`}
          >
            <VoiceIcon className="w-4 h-4" />
            <span>{voiceEnabled ? t(lang, 'voiceOn') : t(lang, 'voiceOff')}</span>
          </button>
        </div>
      </div>

      <section
        aria-label="Turn-by-turn directions"
        className={`z-30 border-t border-ink bg-paper flex flex-col transition-[height] duration-280 ${sheetHeightClass}`}
      >
        <button
          type="button"
          onClick={() =>
            setSheetSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'))
          }
          className="w-full py-2 flex items-center justify-center border-b border-ink/20 cursor-pointer"
          aria-label="Resize directions sheet"
        >
          <span className="w-10 h-1 bg-ink" />
        </button>

        {!isSpeechSynthesisSupported() && voiceEnabled && (
          <p className="px-3 py-1 bg-sandstone border-b border-ink font-mono text-[11px]">
            {t(lang, 'voiceUnavailable')}
          </p>
        )}

        <div
          ref={carouselRef}
          aria-live="polite"
          className="flex-1 overflow-x-auto snap-x snap-mandatory flex gap-3 p-3"
        >
          {route.steps.map((step, idx) => {
            const active = idx === activeStep;
            return (
              <article
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`snap-start shrink-0 w-[85%] sm:w-[340px] border border-ink p-3 flex flex-col justify-between cursor-pointer ${
                  active ? 'bg-signal text-ink' : 'bg-paper text-ink'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase">
                    STEP {idx + 1} / {route.steps.length}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs">
                    {step.kind === 'stairs' && <StairsIcon className="w-4 h-4" />}
                    {step.kind === 'lift' && <LiftIcon className="w-4 h-4" />}
                    {step.meters > 0 && `${step.meters} m`}
                  </span>
                </div>

                <p className="font-semibold text-base leading-snug my-2">
                  {lang === 'hi' ? step.instruction.hi : step.instruction.en}
                </p>

                <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                  <span>
                    {step.floorFrom === 0 ? 'G' : `F${step.floorFrom}`}
                    {step.floorTo !== step.floorFrom
                      ? ` → F${step.floorTo}`
                      : ''}
                  </span>
                  {step.floorTo > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewNavigate('/floors/34');
                      }}
                      className="underline font-semibold cursor-pointer"
                    >
                      {t(lang, 'floorGuide')}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t border-ink px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goStep(activeStep - 1)}
              disabled={activeStep === 0}
              className="min-w-11 min-h-11 border border-ink flex items-center justify-center disabled:opacity-35 cursor-pointer"
              aria-label={t(lang, 'prevStep')}
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => goStep(activeStep + 1)}
              disabled={activeStep === route.steps.length - 1}
              className="min-w-11 min-h-11 border border-ink flex items-center justify-center disabled:opacity-35 cursor-pointer"
              aria-label={t(lang, 'nextStep')}
            >
              <CaretRight size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleOffRoute}
              className="min-h-11 px-2.5 border border-ink flex items-center gap-1 font-mono text-xs uppercase cursor-pointer"
            >
              <ArrowsClockwise size={16} weight="bold" />
              <span>{t(lang, 'offRoute')}</span>
            </button>
            <button
              type="button"
              onClick={handleReport}
              className="min-w-11 min-h-11 border border-ink flex items-center justify-center cursor-pointer"
              title={t(lang, 'reportWrong')}
              aria-label={t(lang, 'reportWrong')}
            >
              <Flag size={16} weight="bold" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleArrive}
            className="min-h-11 px-3 border border-ink bg-moss text-paper font-mono text-xs font-semibold uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={16} weight="bold" />
            <span>{t(lang, 'arrivedBtn')}</span>
          </button>
        </div>

        {reportNotice && (
          <p className="px-3 py-1.5 bg-sandstone border-t border-ink font-mono text-xs">
            {reportNotice}
          </p>
        )}
      </section>

      {arrived && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6"
          onClick={() => setArrived(false)}
        >
          <div className="border-4 border-moss bg-paper px-8 py-6 text-center -rotate-3">
            <p className="font-block-numeral text-4xl text-moss tracking-wider uppercase">
              {t(lang, 'arrivedStamp')}
            </p>
            <p className="font-mono text-xs mt-2 uppercase">
              {destPlace ? destPlace.names[0] : decodedTo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
