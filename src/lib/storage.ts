import { get, set } from 'idb-keyval';

const FAV_KEY = 'wb34_favorites';
const RECENT_KEY = 'wb34_recent';
const REPORT_QUEUE_KEY = 'wb34_report_queue';
const TEST_SESSIONS_KEY = 'wb34_test_sessions';

export interface WrongLocationReport {
  id: string;
  nodeId: string;
  note: string;
  createdAt: string;
}

export interface TestSessionRecord {
  id: string;
  participant: string;
  mode: 'app' | 'control';
  task: string;
  startTs: number;
  arriveTs: number;
  timeToArriveSec: number;
  stepsViewed: number;
  voiceUsed: boolean;
  offRouteTaps: number;
  lostTaps: number;
  confidence?: number;
  textClear?: number;
}

export async function loadFavorites(): Promise<string[]> {
  return (await get<string[]>(FAV_KEY)) ?? ['block-34', 'b34-405'];
}

export async function saveFavorites(ids: string[]): Promise<void> {
  await set(FAV_KEY, ids);
}

export async function loadRecent(): Promise<string[]> {
  return (await get<string[]>(RECENT_KEY)) ?? ['b34-405', 'central-library', 'uni-mall'];
}

export async function saveRecent(ids: string[]): Promise<void> {
  await set(RECENT_KEY, ids.slice(0, 6));
}

export async function queueReport(report: WrongLocationReport): Promise<{ synced: boolean }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (navigator.onLine && supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          node_id: report.nodeId,
          note: report.note,
          created_at: report.createdAt,
        }),
      });
      if (res.ok) return { synced: true };
    } catch {
      // fall through to offline queue
    }
  }

  const existing = (await get<WrongLocationReport[]>(REPORT_QUEUE_KEY)) ?? [];
  existing.push(report);
  await set(REPORT_QUEUE_KEY, existing);
  return { synced: false };
}

export async function flushQueuedReports(): Promise<number> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!navigator.onLine || !supabaseUrl || !supabaseKey) return 0;

  const existing = (await get<WrongLocationReport[]>(REPORT_QUEUE_KEY)) ?? [];
  if (existing.length === 0) return 0;

  const remaining: WrongLocationReport[] = [];
  let flushed = 0;
  for (const r of existing) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          node_id: r.nodeId,
          note: r.note,
          created_at: r.createdAt,
        }),
      });
      if (res.ok) flushed++;
      else remaining.push(r);
    } catch {
      remaining.push(r);
    }
  }
  await set(REPORT_QUEUE_KEY, remaining);
  return flushed;
}

export async function loadTestSessions(): Promise<TestSessionRecord[]> {
  return (await get<TestSessionRecord[]>(TEST_SESSIONS_KEY)) ?? [];
}

export async function saveTestSession(record: TestSessionRecord): Promise<void> {
  const all = await loadTestSessions();
  all.push(record);
  await set(TEST_SESSIONS_KEY, all);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (navigator.onLine && supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/test_sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(record),
      });
    } catch {
      // kept locally in IndexedDB
    }
  }
}
