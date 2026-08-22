import { Hono } from 'hono';
import { Env } from '../env';

export const telemetryRouter = new Hono<{ Bindings: Env }>();

// System launch origin timestamp (continuous stable system uptime baseline)
export const DEFAULT_SYSTEM_START_TIME = 1787356800000;
let currentSystemStartTime = DEFAULT_SYSTEM_START_TIME;

// In-memory state for fast multi-device telemetry synchronization
let totalVisits = 42;
let todayVisits = 1;
let todayDateString = new Date().toISOString().slice(0, 10);
const sessionSet = new Set<string>();

let globalStampCount = 68;

function checkDateRollover() {
  const currentDate = new Date().toISOString().slice(0, 10);
  if (currentDate !== todayDateString) {
    todayDateString = currentDate;
    todayVisits = 0;
    sessionSet.clear();
  }
}

/**
 * GET /api/telemetry
 * Retrieve current system uptime start timestamp, visitor stats, and global stamps
 */
telemetryRouter.get('/', (c) => {
  checkDateRollover();
  return c.json({
    success: true,
    systemStartTime: currentSystemStartTime,
    serverTime: Date.now(),
    totalVisits: Math.max(0, totalVisits),
    todayVisits: Math.max(0, todayVisits),
    stampCount: Math.max(0, globalStampCount),
  });
});

/**
 * POST /api/telemetry/visit
 * Record a client session visit (authoritative multi-device deduplication)
 */
telemetryRouter.post('/visit', async (c) => {
  checkDateRollover();
  try {
    const body = await c.req.json<{ sessionId?: string }>();
    const sessionId = body?.sessionId || '';

    if (sessionId && !sessionSet.has(sessionId)) {
      sessionSet.add(sessionId);
      totalVisits += 1;
      todayVisits += 1;
    }
  } catch {
    // ignore json parse error
  }

  return c.json({
    success: true,
    totalVisits: Math.max(0, totalVisits),
    todayVisits: Math.max(0, todayVisits),
  });
});

/**
 * POST /api/telemetry/stamp
 * Increment global interactive paw stamps
 */
telemetryRouter.post('/stamp', (c) => {
  globalStampCount += 1;
  return c.json({
    success: true,
    stampCount: globalStampCount,
  });
});

/**
 * POST /api/telemetry/reset
 * Admin resets system telemetry (uptime start time, visits, and stamps)
 */
telemetryRouter.post('/reset', async (c) => {
  try {
    const body = await c.req.json<{
      resetUptime?: boolean;
      resetVisits?: boolean;
      resetStamps?: boolean;
    }>().catch(() => ({ resetUptime: true, resetVisits: true, resetStamps: true }));

    const now = Date.now();

    if (body.resetUptime) {
      currentSystemStartTime = now;
    }
    if (body.resetVisits) {
      totalVisits = 0;
      todayVisits = 0;
      sessionSet.clear();
    }
    if (body.resetStamps) {
      globalStampCount = 0;
    }

    return c.json({
      success: true,
      systemStartTime: currentSystemStartTime,
      totalVisits: 0,
      todayVisits: 0,
      stampCount: globalStampCount,
    });
  } catch (err: unknown) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});
