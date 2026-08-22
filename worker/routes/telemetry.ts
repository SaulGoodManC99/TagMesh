import { Hono } from 'hono';
import { Env } from '../env';

export const telemetryRouter = new Hono<{ Bindings: Env }>();

// System launch origin timestamp (continuous stable system uptime baseline)
export const SYSTEM_START_TIME = 1787356800000;

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
    systemStartTime: SYSTEM_START_TIME,
    serverTime: Date.now(),
    totalVisits: Math.max(1, totalVisits),
    todayVisits: Math.max(1, todayVisits),
    stampCount: globalStampCount,
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
    totalVisits: Math.max(1, totalVisits),
    todayVisits: Math.max(1, todayVisits),
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
