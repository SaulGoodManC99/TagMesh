<div align="center">

# 🌸 TagMesh Spark Notes System
### **Pure Tag-Driven · 3D Claymorphic Aesthetics · Hybrid Edge Knowledge Mesh**

*Ditch folders and titles. Weave thoughts organically through `#hashtags` at the edge.*

<br/>

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 SQLite + FTS5](https://img.shields.io/badge/D1-SQLite_FTS5-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![R2 Object Storage](https://img.shields.io/badge/R2-Object_Storage-F6821F?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Local-First](https://img.shields.io/badge/Local--First-Dexie_IndexedDB-10B981?style=for-the-badge)](https://dexie.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Protocol_Ready-8B5CF6?style=for-the-badge)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-rose.svg?style=for-the-badge)](./LICENSE)

<br/>

[🌐 Live Demo Experience](https://tagmesh.top) • [🇨🇳 简体中文](./README_CN.md) • [🇬🇧 English](./README.md)

</div>

---

## 💡 Why TagMesh?

Traditional note apps force unnecessary friction before you even begin writing: **"Which folder should this go into?"** or **"What should the title be?"**. This heavy cognitive load often kills fleeting creative sparks before they can take root.

**TagMesh redefines the note-taking experience:**
- **Zero Folders · Zero Titles**: Your thoughts are raw Markdown stream. Organization is powered entirely by `#hashtags` typed anywhere in the body.
- **3D Claymorphic Aesthetics**: Tactile embossed cards, satisfying acoustic click sounds, responsive particle physics bursts, and 6 mood themes.
- **Local-First + Global Edge**: Zero-millisecond local responses via IndexedDB, backed by silent debounced syncing to Cloudflare D1 + R2. Write seamlessly even without an internet connection.
- **AI-Native via MCP**: Native Serverless Model Context Protocol (MCP) gateway allowing Claude, Cursor, and other AI agents to read, search, and weave your notes directly.

---

## 🏛️ System Architecture

TagMesh is built on a **Local-First + Serverless Edge** hybrid architecture:

```mermaid
flowchart TD
    subgraph Client ["💻 Local-First Web Client"]
        UI["🎨 3D Claymorphism UI / 5 Note Views"]
        TipTap["✍️ TipTap Rich-Text Editor / #Hashtag Autocomplete"]
        DexieDB[("💾 Dexie.js (IndexedDB Instant Local Storage)")]
        AudioConfetti["🔊 Tactile Sound Effects & Particle Engine"]
        
        UI <--> TipTap
        TipTap <--> DexieDB
        UI -.-> AudioConfetti
    end

    subgraph CloudflareEdge ["☁️ Cloudflare Global Edge Network (tagmesh.top)"]
        Worker["⚡ Cloudflare Workers (Hono REST & MCP Gateway)"]
        D1[("🗄️ Cloudflare D1 (SQLite + FTS5 Search Engine)")]
        R2[("📦 Cloudflare R2 (Zero-Egress Image Hosting & Snapshots)")]
        Assets["🌐 Cloudflare Static Assets (SPA Edge CDN)"]

        Worker <--> D1
        Worker <--> R2
    end

    subgraph AIAgents ["🤖 AI Agent Ecosystem (MCP Clients)"]
        Claude["Claude Desktop"]
        Cursor["Cursor IDE"]
        Windsurf["Windsurf / Cline"]
    end

    DexieDB <-- "1.5s Debounced Silent Sync" --> Worker
    TipTap <-- "Ctrl+V Screenshot Instant Upload" --> Worker
    AIAgents <-- "JSON-RPC / Bearer Auth MCP Protocol" --> Worker
```

---

## ✨ Key Features

### 1. 🏷️ Zero-Folder Tag-Mesh
- Eliminate rigid folder trees. The first sentence is automatically distilled into an aesthetic card excerpt.
- Typing `#` triggers an instant hashtag autocomplete menu, aggregating related cards with a single click.

### 2. 🧭 5 Immersive Note Views
- **🍱 Bento Grid**: Dynamic asymmetric masonry waterfall with balanced visual hierarchy.
- **📷 Polaroid Board**: Vintage retro polaroid cards with masking tape and slight random tilts.
- **🎠 3D Carousel**: Spatial 3D cylindrical stage supporting smooth mouse-wheel & gesture rotation.
- **📜 Timeline Scroll**: Chronological stream mapping your creative evolution over time.
- **🌌 Floating Canvas**: Micro-floating weightless cards gently drifting with ambient particles.

### 3. 📷 Cloudflare R2 Image Hosting & Cloud Snapshots
- **Instant Screenshot Upload**: Paste screenshots directly with <kbd>Ctrl</kbd> + <kbd>V</kbd> or drag-and-drop external image files. Uploaded directly to R2 with zero egress fees and edge CDN caching.
- **1-Click Cloud Snapshots**: Backup the entire local IndexedDB database to R2 with one click from the Admin Console. Inspect historical snapshots and perform 1-click time machine restores.

### 4. 👑🌱 Dual-Track Curator & Traveler Tag Isolation
- **Scoped Tag Pools & Counts**: Switching between "All", "Curator", and "Traveler" tabs dynamically recalculates tag frequencies scoped strictly to the active author role.
- **Smart Auto-Fallback**: If an active tag does not exist under the switched role, the system smoothly resets to `#all`, preventing empty state breaks.

### 5. 🤖 Native Serverless Model Context Protocol (MCP) Gateway
- 8 standard AI tools available at the edge (Create Note, Search FTS5, Aggregate Tags, Full Sync, Snapshots, etc.).
- Easily integrated into Claude Desktop, Cursor, and other AI agents via Bearer token authentication.

### 6. 💬 Live Danmaku Plaza
- Real-time cross-device floating danmaku messages, paw stamp reactions, live server uptime telemetry, and deduplicated visitor tracking.

---

## ⚡ Global Keyboard Shortcuts

| Shortcut | Description | Context |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Open Global Command Center** (Search notes / hit enter to create) | Global |
| <kbd>Cmd</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | **Toggle Left Tag-Mesh Sidebar** | Global |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Create Blank Note Instantly** (100ms response) | Global |
| <kbd>#</kbd> | **Trigger Hashtag Autocomplete Dropdown** | Inside Editor |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | **Paste Clipboard Screenshot & Upload directly to R2** | Inside Editor |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **Toggle Bilingual Interface** (English / 简体中文) | Global |

---

## 🚀 Quick Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh
npm install
```

### 2. Start Frontend Dev Server
```bash
npm run dev
# Open http://localhost:5173 (LAN access supported)
```

### 3. Start Local Cloudflare Worker Service
```bash
npm run worker:dev
# Worker API running on http://localhost:8787
```

---

## ☁️ Step-by-Step Cloudflare Deployment Guide

TagMesh runs entirely on Cloudflare's free tier (Workers + D1 + R2 + Static Assets) with zero server maintenance costs.

### Step 1: Login via Wrangler CLI
```bash
npx wrangler login
```

### Step 2: Create D1 Database & Execute Schema
```bash
# 1. Create D1 database
npx wrangler d1 create tagmesh-db

# 2. Execute SQL schema (creates notes table, FTS5 index, telemetry & danmaku tables)
npx wrangler d1 execute tagmesh-db --remote --file=./schema.sql
```
> 💡 Copy the generated `database_id` and ensure it is updated in your `wrangler.toml`.

### Step 3: Create R2 Object Storage Bucket
```bash
# Create R2 bucket (apac location recommended for low latency)
npx wrangler r2 bucket create tagmesh-bucket --location=apac
```

### Step 4: Verify `wrangler.toml` Configuration
Ensure your root [`wrangler.toml`](./wrangler.toml) includes the following bindings:
```toml
name = "tagmesh-markdown"
main = "worker/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
not_found_handling = "single-page-application"

[[d1_databases]]
binding = "DB"
database_name = "tagmesh-db"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "tagmesh-bucket"

[vars]
ENVIRONMENT = "production"
MCP_AUTH_TOKEN = "tagmesh_mcp_secret_bearer_token"
```

### Step 5: Build & Deploy to Production
```bash
# 1. Build production frontend assets
npm run build

# 2. Deploy Worker and Static Assets to Cloudflare
npx wrangler deploy
```

### Step 6: Bind Custom Domain (Optional)
In your [Cloudflare Dashboard](https://dash.cloudflare.com/):
1. Navigate to **Workers & Pages** -> select `tagmesh-markdown`;
2. Go to **Settings** -> **Domains & Routes** -> **Add Custom Domain**;
3. Enter your domain (e.g. `tagmesh.top`). Cloudflare will automatically provision SSL certificates and edge routing in seconds!

### Step 7: Configure Automated GitHub Actions CI/CD (Recommended)
In your GitHub Repository **Settings** -> **Secrets and variables** -> **Actions**, add these 3 secrets:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token with Workers editing permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
- `CLOUDFLARE_D1_DATABASE_ID`: Your D1 Database ID

> Once configured, every `git push` to the `main` branch will trigger an automated build and deployment in under 30 seconds!

---

## 🤖 MCP (Model Context Protocol) AI Client Integration

TagMesh natively exposes a Serverless MCP endpoint to act as a second brain for AI assistants:

### 1. Claude Desktop Configuration
Edit `claude_desktop_config.json` (On Windows: `%APPDATA%\Claude\claude_desktop_config.json`, on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tagmesh": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://tagmesh.top/mcp",
        "--header",
        "Authorization: Bearer tagmesh_mcp_secret_bearer_token"
      ]
    }
  }
}
```

### 2. Cursor / Windsurf / Cline Configuration
In your IDE's MCP settings:
```json
{
  "mcpServers": {
    "tagmesh": {
      "url": "https://tagmesh.top/mcp",
      "headers": {
        "Authorization": "Bearer tagmesh_mcp_secret_bearer_token"
      }
    }
  }
}
```

---

## 📦 Tech Stack

| Category | Technology Stack |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite 6 |
| **Styling & Physics** | Tailwind CSS v4, Lucide Icons, Canvas Particle Physics |
| **Editor** | TipTap Core, ProseMirror, Hashtag / Emoji / R2 Upload Extensions |
| **Local Persistence** | Dexie.js (IndexedDB Local-First Wrapper), dexie-react-hooks |
| **Edge Serverless** | Cloudflare Workers, Hono Web Framework, Nodejs Compat |
| **Cloud Storage** | Cloudflare D1 (SQLite + FTS5), Cloudflare R2 (Object Storage) |
| **AI Protocol** | Model Context Protocol (MCP) JSON-RPC 2.0 |

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Contributions, issues, and feature suggestions are always welcome!
