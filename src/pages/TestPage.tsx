import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadTestSessions, saveTestSession, type TestSessionRecord } from '../lib/storage';

export function TestPage() {
  const [params] = useSearchParams();
  const [participant, setParticipant] = useState(params.get('p') ?? 'P01');
  const [task, setTask] = useState(params.get('task') ?? 'maingate-b34');
  const [mode, setMode] = useState<'app' | 'control'>('app');

  const [running, setRunning] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [stepsViewed, setStepsViewed] = useState(0);
  const [offRouteTaps, setOffRouteTaps] = useState(0);
  const [lostTaps, setLostTaps] = useState(0);
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [confidence, setConfidence] = useState(4);
  const [textClear, setTextClear] = useState(4);
  const [sessions, setSessions] = useState<TestSessionRecord[]>([]);

  useEffect(() => {
    void loadTestSessions().then(setSessions);
  }, []);

  useEffect(() => {
    if (!running || !startTs) return;
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startTs) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [running, startTs]);

  const startSession = () => {
    setStartTs(Date.now());
    setElapsedSec(0);
    setStepsViewed(0);
    setOffRouteTaps(0);
    setLostTaps(0);
    setRunning(true);
  };

  const finishSession = async () => {
    if (!startTs) return;
    const arriveTs = Date.now();
    const record: TestSessionRecord = {
      id: `${participant}-${arriveTs}`,
      participant,
      mode,
      task,
      startTs,
      arriveTs,
      timeToArriveSec: Math.round((arriveTs - startTs) / 1000),
      stepsViewed,
      voiceUsed,
      offRouteTaps,
      lostTaps,
      confidence,
      textClear,
    };
    setRunning(false);
    await saveTestSession(record);
    setSessions(await loadTestSessions());
  };

  const exportCsv = () => {
    const headers = [
      'id',
      'participant',
      'mode',
      'task',
      'startTs',
      'arriveTs',
      'timeToArriveSec',
      'stepsViewed',
      'voiceUsed',
      'offRouteTaps',
      'lostTaps',
      'confidence',
      'textClear',
    ];
    const rows = sessions.map((s) =>
      headers.map((h) => JSON.stringify(s[h as keyof TestSessionRecord] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wb34-test-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
      <div className="border-b border-ink pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-block-numeral text-xl uppercase">Usability Test Harness</h1>
          <p className="font-mono text-xs text-ink/75">INT335 Viva Baseline & App Study</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="min-h-11 px-3 border border-ink bg-signal font-mono text-xs font-semibold uppercase cursor-pointer"
        >
          Export CSV ({sessions.length})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="font-mono text-xs">
          Participant
          <input
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
            className="mt-1 w-full min-h-11 px-2 border border-ink bg-paper"
          />
        </label>
        <label className="font-mono text-xs">
          Task
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="mt-1 w-full min-h-11 px-2 border border-ink bg-paper"
          />
        </label>
        <label className="font-mono text-xs">
          Condition
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'app' | 'control')}
            className="mt-1 w-full min-h-11 px-2 border border-ink bg-paper"
          >
            <option value="app">With App</option>
            <option value="control">Control (No App)</option>
          </select>
        </label>
      </div>

      {/* Stopwatch */}
      <div className="border border-ink bg-sandstone p-4 flex items-center justify-between">
        <span className="font-block-numeral text-4xl">{elapsedSec}s</span>
        {!running ? (
          <button
            type="button"
            onClick={startSession}
            className="min-h-12 px-4 border border-ink bg-signal font-mono text-xs font-semibold uppercase cursor-pointer"
          >
            Start Task
          </button>
        ) : (
          <button
            type="button"
            onClick={finishSession}
            className="min-h-12 px-4 border border-ink bg-moss text-paper font-mono text-xs font-semibold uppercase cursor-pointer"
          >
            I&apos;ve Arrived
          </button>
        )}
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setStepsViewed((n) => n + 1)}
          className="min-h-11 border border-ink bg-paper px-3 text-left cursor-pointer"
        >
          Steps viewed: {stepsViewed} (+1)
        </button>
        <button
          type="button"
          onClick={() => setOffRouteTaps((n) => n + 1)}
          className="min-h-11 border border-ink bg-paper px-3 text-left cursor-pointer"
        >
          Off-route taps: {offRouteTaps} (+1)
        </button>
        <button
          type="button"
          onClick={() => setLostTaps((n) => n + 1)}
          className="min-h-11 border border-ink bg-paper px-3 text-left cursor-pointer"
        >
          I&apos;m lost taps: {lostTaps} (+1)
        </button>
        <button
          type="button"
          onClick={() => setVoiceUsed((v) => !v)}
          className={`min-h-11 border border-ink px-3 text-left cursor-pointer ${
            voiceUsed ? 'bg-signal' : 'bg-paper'
          }`}
        >
          Voice used: {voiceUsed ? 'Yes' : 'No'}
        </button>
      </div>

      {/* Post-task Likert */}
      <div className="border border-ink bg-paper p-3 grid grid-cols-2 gap-3 font-mono text-xs">
        <label>
          Confidence (1–5): {confidence}
          <input
            type="range"
            min={1}
            max={5}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-brick"
          />
        </label>
        <label>
          Route text clear (1–5): {textClear}
          <input
            type="range"
            min={1}
            max={5}
            value={textClear}
            onChange={(e) => setTextClear(Number(e.target.value))}
            className="w-full accent-brick"
          />
        </label>
      </div>

      {/* Recorded sessions table */}
      {sessions.length > 0 && (
        <div className="border border-ink bg-paper overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead className="border-b border-ink bg-sandstone">
              <tr>
                <th className="p-2">P</th>
                <th className="p-2">Mode</th>
                <th className="p-2">Task</th>
                <th className="p-2">Time</th>
                <th className="p-2">Conf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="p-2">{s.participant}</td>
                  <td className="p-2">{s.mode}</td>
                  <td className="p-2">{s.task}</td>
                  <td className="p-2">{s.timeToArriveSec}s</td>
                  <td className="p-2">{s.confidence}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
