-- ==============================================================================
-- TAGMESH MARKDOWN: Cloudflare D1 Schema (Robust FTS5 without trigger bugs)
-- ==============================================================================

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS notes_ai;
DROP TRIGGER IF EXISTS notes_ad;
DROP TRIGGER IF EXISTS notes_au;

-- 1. Main Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    raw_markdown TEXT NOT NULL,
    excerpt TEXT NOT NULL,                -- First non-empty line preview
    tags_json TEXT NOT NULL DEFAULT '[]', -- JSON array of tags, e.g. ["#cloudflare", "#架构"]
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1, -- 1 if public in gallery, 0 if private
    created_at INTEGER NOT NULL,          -- Epoch ms
    updated_at INTEGER NOT NULL,          -- Epoch ms
    synced_at INTEGER NOT NULL,           -- Epoch ms
    author TEXT NOT NULL DEFAULT 'admin', -- 'admin'
    is_official INTEGER NOT NULL DEFAULT 1, -- 1 if official/admin note
    likes INTEGER NOT NULL DEFAULT 0      -- Interactive like count
);

CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_is_public ON notes(is_public);

-- 2. FTS5 Full-Text Search Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    id UNINDEXED,
    raw_markdown,
    tags_json,
    tokenize='porter unicode61'
);

-- 3. System Telemetry & Persistent Uptime Table
CREATE TABLE IF NOT EXISTS system_telemetry (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 4. System Settings Table (Telegram & Third-party Integrations)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);



