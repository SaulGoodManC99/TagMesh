export interface Note {
  id: string;
  rawMarkdown: string;
  excerpt: string;          // First non-empty line preview summary
  tags: string[];           // Extracted hashtags, e.g. ["#cloudflare", "#架构"]
  wordCount: number;
  charCount: number;
  version: number;          // Concurrency control
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: number;        // Epoch ms
  updatedAt: number;        // Epoch ms
  syncedAt?: number;        // Epoch ms
  isDirty?: boolean;        // Local-only
  isOfficial?: boolean;     // True if created by Admin (馆长精选/官方卡片)
  author?: string;          // 'admin' | 'guest' | custom nickname
  likes?: number;           // D1 & local persistent like counter
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncPayload {
  note: Note;
  clientVersion: number;
}

export interface SyncResponse {
  success: boolean;
  note?: Note;
  message?: string;
}

export interface TagCount {
  tag: string;
  count: number;
}
