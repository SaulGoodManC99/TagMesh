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
 * Upload image screenshot directly to Cloudflare R2
 */
export async function uploadImageToR2(file: File | Blob): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  const filename = file instanceof File ? file.name : `screenshot-${Date.now()}.png`;
  formData.append('file', file, filename);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`R2 Upload failed: ${err}`);
  }

  const data = await res.json() as { url: string; key: string; success: boolean };
  return { url: data.url, key: data.key };
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
