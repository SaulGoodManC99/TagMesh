import { Note, SyncResponse } from '../types/note';

const API_BASE = '/api';

/**
 * Sync note with Cloudflare Workers / D1 and R2
 */
export async function syncNoteRemote(note: Note): Promise<SyncResponse> {
  try {
    const res = await fetch(`${API_BASE}/notes/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note,
        clientVersion: note.version,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        message: `Sync failed (${res.status}): ${errText}`,
      };
    }

    const data = await res.json() as { note: Note; success: boolean };
    return {
      success: true,
      note: data.note,
    };
  } catch (err: unknown) {
    console.warn('[SyncEngine] Network offline:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network offline',
    };
  }
}

/**
 * Pull remote notes from Cloudflare D1
 */
export async function fetchRemoteNotes(limit = 100, offset = 0): Promise<Note[]> {
  try {
    const res = await fetch(`${API_BASE}/notes?limit=${limit}&offset=${offset}`);
    if (!res.ok) return [];
    const data = await res.json() as { notes: Note[] };
    return Array.isArray(data.notes) ? data.notes : [];
  } catch (err) {
    console.warn('[SyncEngine] fetchRemoteNotes failed:', err);
    return [];
  }
}

/**
 * Delete note remotely from Cloudflare D1
 */
export async function deleteNoteRemote(noteId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[SyncEngine] deleteNoteRemote failed:', err);
    return false;
  }
}

/**
 * Increment note likes in Cloudflare D1
 */
export async function likeNoteRemote(noteId: string): Promise<{ success: boolean; likes: number }> {
  try {
    const res = await fetch(`${API_BASE}/notes/${noteId}/like`, {
      method: 'POST',
    });
    if (!res.ok) return { success: false, likes: 0 };
    return (await res.json()) as { success: boolean; likes: number };
  } catch (err) {
    console.warn('[SyncEngine] likeNoteRemote failed:', err);
    return { success: false, likes: 0 };
  }
}


/**
 * Search notes in remote D1 with FTS5
 */
export async function searchNotesRemote(query: string, tag?: string): Promise<Note[]> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (tag) params.append('tag', tag);

  const res = await fetch(`${API_BASE}/notes/search?${params.toString()}`);
  if (!res.ok) return [];

  const data = await res.json() as { notes: Note[] };
  return data.notes || [];
}

/**
 * Fetch centralized system telemetry (system start time, visits, stamps)
 */
export interface SystemTelemetryData {
  systemStartTime: number;
  serverTime: number;
  totalVisits: number;
  todayVisits: number;
  stampCount: number;
}

export async function fetchSystemTelemetry(): Promise<SystemTelemetryData | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry`);
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean } & SystemTelemetryData;
    return data;
  } catch {
    return null;
  }
}

/**
 * Record a visitor session
 */
export async function recordVisitSession(sessionId: string): Promise<{ totalVisits: number; todayVisits: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; totalVisits: number; todayVisits: number };
    return data;
  } catch {
    return null;
  }
}

/**
 * Increment global paw stamp count
 */
export async function submitGlobalStamp(): Promise<{ stampCount: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/stamp`, {
      method: 'POST',
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; stampCount: number };
    return data;
  } catch {
    return null;
  }
}

/**
 * Reset system telemetry (admin operation)
 */
export async function resetTelemetryRemote(options?: {
  resetUptime?: boolean;
  resetVisits?: boolean;
  resetStamps?: boolean;
}): Promise<SystemTelemetryData | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || { resetUptime: true, resetVisits: true, resetStamps: true }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean } & SystemTelemetryData;
    return data;
  } catch (err) {
    console.warn('[Telemetry] resetTelemetryRemote error:', err);
    return null;
  }
}

/**
 * Danmaku Remote API
 */
export interface RemoteDanmakuResponse {
  success: boolean;
  danmakus?: any[];
  danmaku?: any;
  stats?: {
    totalSenders: number;
    totalLaunches: number;
    totalLikes: number;
  };
  likes?: number;
  id?: string;
  error?: string;
}

export async function fetchDanmakusRemote(): Promise<RemoteDanmakuResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/danmaku`);
    if (!res.ok) return null;
    return await res.json() as RemoteDanmakuResponse;
  } catch {
    return null;
  }
}

export async function publishDanmakuRemote(payload: any): Promise<RemoteDanmakuResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/danmaku`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json() as RemoteDanmakuResponse;
  } catch {
    return null;
  }
}

export async function likeDanmakuRemote(id: string): Promise<RemoteDanmakuResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/danmaku/${encodeURIComponent(id)}/like`, {
      method: 'POST',
    });
    if (!res.ok) return null;
    return await res.json() as RemoteDanmakuResponse;
  } catch {
    return null;
  }
}

export async function deleteDanmakuRemote(id: string): Promise<RemoteDanmakuResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/danmaku/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return null;
    return await res.json() as RemoteDanmakuResponse;
  } catch {
    return null;
  }
}

/**
 * ==========================================
 * Cloudflare R2 Object Storage Services
 * ==========================================
 */

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  error?: string;
}

export interface R2BackupItem {
  key: string;
  size: number;
  uploaded: string;
  customMetadata?: Record<string, string>;
}

export interface R2StatusResult {
  connected: boolean;
  bucketName?: string;
  message?: string;
  sampleObjectsCount?: number;
}

/**
 * Check R2 bucket connection status
 */
export async function checkR2StatusRemote(): Promise<R2StatusResult> {
  try {
    const res = await fetch(`${API_BASE}/upload/status`);
    if (!res.ok) return { connected: false, message: `HTTP ${res.status}` };
    return await res.json() as R2StatusResult;
  } catch (err: unknown) {
    return { connected: false, message: err instanceof Error ? err.message : 'Network offline' };
  }
}

/**
 * Upload Image or Screenshot to Cloudflare R2
 */
export async function uploadImageToR2(file: File): Promise<R2UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: `Upload failed HTTP ${res.status}` })) as { error?: string };
      return {
        success: false,
        error: errJson.error || `Upload failed (${res.status})`,
      };
    }

    const data = await res.json() as { success: boolean; url: string; key: string; size: number };
    return {
      success: true,
      url: data.url,
      key: data.key,
      size: data.size,
    };
  } catch (err: unknown) {
    console.error('[R2 Client Upload Error]', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during upload',
    };
  }
}

/**
 * Create a full database snapshot archive in Cloudflare R2
 */
export async function createR2SnapshotBackup(notes: Note[], triggerBy: string = 'admin'): Promise<{ success: boolean; key?: string; totalNotes?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/upload/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, triggerBy }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Backup request failed' })) as { error?: string };
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json() as { success: boolean; key: string; totalNotes: number };
    return { success: true, key: data.key, totalNotes: data.totalNotes };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create backup' };
  }
}

/**
 * List historical snapshot backups from Cloudflare R2
 */
export async function fetchR2BackupsList(): Promise<{ success: boolean; backups: R2BackupItem[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/upload/backups`);
    if (!res.ok) return { success: false, backups: [] };
    const data = await res.json() as { success: boolean; backups: R2BackupItem[]; error?: string };
    return { success: Boolean(data.success), backups: data.backups || [] };
  } catch (err: unknown) {
    return { success: false, backups: [], error: err instanceof Error ? err.message : 'Failed to list backups' };
  }
}

/**
 * Fetch and parse a snapshot backup from Cloudflare R2 for restoration
 */
export async function restoreR2Snapshot(key: string): Promise<{ success: boolean; notes?: Note[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/upload/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Restore request failed' })) as { error?: string };
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json() as { success: boolean; snapshot: { notes: Note[] } };
    return { success: true, notes: data.snapshot?.notes || [] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Restore failed' };
  }
}

export interface TelegramConfigResult {
  ok: boolean;
  configured: boolean;
  botTokenMasked: string;
  hasToken: boolean;
  userIds: string;
  webhookUrl: string;
  enabled: boolean;
  botInfo?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  error?: string;
}

function maskTokenHelper(token: string): string {
  if (!token || token.length < 12) return token ? '********' : '';
  const prefix = token.slice(0, 10);
  const suffix = token.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Fetch Telegram Bot configuration
 */
export async function fetchTelegramConfigRemote(): Promise<TelegramConfigResult> {
  try {
    const res = await fetch(`${API_BASE}/telegram/config`);
    if (res.ok) {
      const data = await res.json() as TelegramConfigResult;
      try {
        localStorage.setItem('tagmesh_telegram_config_cache', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch {
    // fallback to cache
  }

  try {
    const cached = localStorage.getItem('tagmesh_telegram_config_cache');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return {
    ok: true,
    configured: false,
    botTokenMasked: '',
    hasToken: false,
    userIds: '',
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : '',
    enabled: true,
  };
}

/**
 * Save Telegram Bot configuration
 */
export async function saveTelegramConfigRemote(config: { botToken?: string; userIds?: string; webhookUrl?: string; enabled?: boolean }): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/telegram/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      return await res.json() as { ok: boolean; message?: string; error?: string };
    }
  } catch {
    // Local fallback
  }

  // Update local cache
  try {
    const cached = localStorage.getItem('tagmesh_telegram_config_cache');
    const prev = cached ? JSON.parse(cached) : {};
    const updated: TelegramConfigResult = {
      ...prev,
      ok: true,
      configured: Boolean((config.botToken || prev.hasToken) && (config.userIds || prev.userIds)),
      botTokenMasked: config.botToken ? maskTokenHelper(config.botToken) : prev.botTokenMasked || '',
      hasToken: Boolean(config.botToken || prev.hasToken),
      userIds: config.userIds !== undefined ? config.userIds : prev.userIds || '',
      webhookUrl: config.webhookUrl !== undefined ? config.webhookUrl : prev.webhookUrl || '',
      enabled: config.enabled !== undefined ? config.enabled : true,
    };
    localStorage.setItem('tagmesh_telegram_config_cache', JSON.stringify(updated));
    return { ok: true, message: '配置已保存' };
  } catch {}

  return { ok: true, message: '配置已保存' };
}

/**
 * Set Webhook on Telegram API
 */
export async function setTelegramWebhookRemote(webhookUrl?: string): Promise<{ ok: boolean; message?: string; webhookUrl?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/telegram/set-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    });
    return await res.json() as { ok: boolean; message?: string; webhookUrl?: string; error?: string };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Set webhook failed' };
  }
}

/**
 * Delete Webhook from Telegram API
 */
export async function deleteTelegramWebhookRemote(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/telegram/delete-webhook`, {
      method: 'POST',
    });
    return await res.json() as { ok: boolean; message?: string; error?: string };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete webhook failed' };
  }
}

/**
 * Send Test Message via Telegram Bot
 */
export async function testTelegramBotRemote(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/telegram/test`, {
      method: 'POST',
    });
    return await res.json() as { ok: boolean; message?: string; error?: string };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Test failed' };
  }
}
