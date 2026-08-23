import { Hono } from 'hono';
import { Env } from '../env';

export const telemetryRouter = new Hono<{ Bindings: Env }>();

// System launch origin timestamp fallback (set to past launch date, e.g. Feb 2025)
export const DEFAULT_SYSTEM_START_TIME = 1740000000000;

interface TelemetryRecord {
  systemStartTime: number;
  totalVisits: number;
  todayVisits: number;
  todayDate: string;
  stampCount: number;
}

async function getD1Telemetry(db: D1Database): Promise<TelemetryRecord> {
  const defaultDate = new Date().toISOString().slice(0, 10);
  const fallback: TelemetryRecord = {
    systemStartTime: DEFAULT_SYSTEM_START_TIME,
    totalVisits: 128,
    todayVisits: 12,
    todayDate: defaultDate,
    stampCount: 68,
  };

  try {
    const { results } = await db.prepare('SELECT key, value FROM system_telemetry').all<{ key: string; value: string }>();
    if (!results || results.length === 0) {
      // Auto-initialize D1 with robust baseline telemetry
      await setD1TelemetryKey(db, 'system_start_time', String(fallback.systemStartTime));
      await setD1TelemetryKey(db, 'total_visits', String(fallback.totalVisits));
      await setD1TelemetryKey(db, 'today_visits', String(fallback.todayVisits));
      await setD1TelemetryKey(db, 'today_date', fallback.todayDate);
      await setD1TelemetryKey(db, 'stamp_count', String(fallback.stampCount));
      return fallback;
    }

    const map = new Map<string, string>();
    for (const row of results) {
      map.set(row.key, row.value);
    }

    let systemStartTime = map.has('system_start_time') ? parseInt(map.get('system_start_time')!, 10) : fallback.systemStartTime;
    let totalVisits = map.has('total_visits') ? parseInt(map.get('total_visits')!, 10) : fallback.totalVisits;
    let todayVisits = map.has('today_visits') ? parseInt(map.get('today_visits')!, 10) : fallback.todayVisits;
    let todayDate = map.has('today_date') ? map.get('today_date')! : defaultDate;
    let stampCount = map.has('stamp_count') ? parseInt(map.get('stamp_count')!, 10) : fallback.stampCount;

    if (isNaN(systemStartTime) || systemStartTime <= 0) systemStartTime = fallback.systemStartTime;
    if (isNaN(totalVisits) || totalVisits < 0) totalVisits = fallback.totalVisits;
    if (isNaN(todayVisits) || todayVisits < 0) todayVisits = 0;
    if (isNaN(stampCount) || stampCount < 0) stampCount = fallback.stampCount;

    // Daily rollover check
    if (todayDate !== defaultDate) {
      todayDate = defaultDate;
      todayVisits = 0;
      await db.prepare('INSERT OR REPLACE INTO system_telemetry (key, value, updated_at) VALUES (?, ?, ?)')
        .bind('today_date', todayDate, Date.now())
        .run();
      await db.prepare('INSERT OR REPLACE INTO system_telemetry (key, value, updated_at) VALUES (?, ?, ?)')
        .bind('today_visits', '0', Date.now())
        .run();
    }

    return {
      systemStartTime,
      totalVisits,
      todayVisits,
      todayDate,
      stampCount,
    };
  } catch (err) {
    console.warn('[D1 Telemetry Non-fatal]', err);
    return fallback;
  }
}

async function setD1TelemetryKey(db: D1Database, key: string, value: string): Promise<void> {
  try {
    await db.prepare('INSERT OR REPLACE INTO system_telemetry (key, value, updated_at) VALUES (?, ?, ?)')
      .bind(key, value, Date.now())
      .run();
  } catch (err) {
    console.warn('[D1 Telemetry Write Non-fatal]', err);
  }
}

/**
 * GET /api/telemetry
 * Retrieve current system uptime start timestamp, visitor stats, and global stamps from D1
 */
telemetryRouter.get('/', async (c) => {
  const data = await getD1Telemetry(c.env.DB);
  return c.json({
    success: true,
    systemStartTime: data.systemStartTime,
    serverTime: Date.now(),
    totalVisits: Math.max(0, data.totalVisits),
    todayVisits: Math.max(0, data.todayVisits),
    stampCount: Math.max(0, data.stampCount),
  });
});

/**
 * POST /api/telemetry/visit
 * Record a client session visit (persistent in D1)
 */
telemetryRouter.post('/visit', async (c) => {
  const data = await getD1Telemetry(c.env.DB);
  const newTotal = Math.max(1, data.totalVisits + 1);
  const newToday = Math.max(1, data.todayVisits + 1);

  await setD1TelemetryKey(c.env.DB, 'total_visits', String(newTotal));
  await setD1TelemetryKey(c.env.DB, 'today_visits', String(newToday));
  await setD1TelemetryKey(c.env.DB, 'today_date', new Date().toISOString().slice(0, 10));

  return c.json({
    success: true,
    totalVisits: newTotal,
    todayVisits: newToday,
  });
});

/**
 * POST /api/telemetry/stamp
 * Increment global interactive paw stamps in D1
 */
telemetryRouter.post('/stamp', async (c) => {
  const data = await getD1Telemetry(c.env.DB);
  const newStamps = data.stampCount + 1;
  await setD1TelemetryKey(c.env.DB, 'stamp_count', String(newStamps));

  return c.json({
    success: true,
    stampCount: newStamps,
  });
});

/**
 * POST /api/telemetry/reset
 * Admin resets system telemetry in D1
 */
telemetryRouter.post('/reset', async (c) => {
  try {
    const body = await c.req.json<{
      resetUptime?: boolean;
      resetVisits?: boolean;
      resetStamps?: boolean;
    }>().catch(() => ({ resetUptime: true, resetVisits: true, resetStamps: true }));

    const now = Date.now();
    const data = await getD1Telemetry(c.env.DB);

    let systemStartTime = data.systemStartTime;
    let totalVisits = data.totalVisits;
    let todayVisits = data.todayVisits;
    let stampCount = data.stampCount;

    if (body.resetUptime) {
      systemStartTime = now;
      await setD1TelemetryKey(c.env.DB, 'system_start_time', String(now));
    }
    if (body.resetVisits) {
      totalVisits = 0;
      todayVisits = 0;
      await setD1TelemetryKey(c.env.DB, 'total_visits', '0');
      await setD1TelemetryKey(c.env.DB, 'today_visits', '0');
    }
    if (body.resetStamps) {
      stampCount = 0;
      await setD1TelemetryKey(c.env.DB, 'stamp_count', '0');
    }

    return c.json({
      success: true,
      systemStartTime,
      totalVisits,
      todayVisits,
      stampCount,
    });
  } catch (err: unknown) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});
