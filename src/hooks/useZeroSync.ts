import { useState, useEffect, useRef, useCallback } from 'react';
import { Note, SyncState } from '../types/note';
import { db } from '../db/dexie';
import { syncNoteRemote } from '../services/api';

export interface UseZeroSyncResult {
  syncState: SyncState;
  lastSyncedAt: number | null;
  forceSyncNow: () => Promise<void>;
}

export function useZeroSync(activeNote: Note | null): UseZeroSyncResult {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => activeNote?.syncedAt || null);

  const activeNoteRef = useRef<Note | null>(activeNote);
  const timerRef = useRef<number | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    activeNoteRef.current = activeNote;
    if (activeNote?.syncedAt) {
      setLastSyncedAt(activeNote.syncedAt);
    }
  }, [activeNote]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      if (activeNoteRef.current?.isDirty) {
        triggerSync();
      } else {
        setSyncState('synced');
      }
    };

    const handleOffline = () => {
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const performSync = useCallback(async (noteToSync: Note) => {
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncState('syncing');

    try {
      const response = await syncNoteRemote(noteToSync);

      if (response.success && response.note) {
        const syncedNote = response.note;
        await db.notes.update(noteToSync.id, {
          version: syncedNote.version,
          syncedAt: syncedNote.syncedAt || Date.now(),
          isDirty: false,
        });

        setLastSyncedAt(syncedNote.syncedAt || Date.now());
        setSyncState('synced');
      } else {
        setSyncState(navigator.onLine ? 'error' : 'offline');
      }
    } catch {
      setSyncState(navigator.onLine ? 'error' : 'offline');
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const triggerSync = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!activeNoteRef.current) return;

    setSyncState('syncing');
    timerRef.current = window.setTimeout(() => {
      if (activeNoteRef.current) {
        performSync(activeNoteRef.current);
      }
    }, 1500);
  }, [performSync]);

  useEffect(() => {
    if (activeNote?.isDirty) {
      triggerSync();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeNote?.rawMarkdown, activeNote?.tags, activeNote?.isDirty, triggerSync]);

  const forceSyncNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (activeNoteRef.current) {
      await performSync(activeNoteRef.current);
    }
  }, [performSync]);

  return {
    syncState,
    lastSyncedAt,
    forceSyncNow,
  };
}
