<div align="center">

# 🌸 TagMesh
### **Serverless, 100% Free & Open-Source Tag-Driven Markdown Notes on Cloudflare with Native MCP**
### **无需服务器 · 0 费用 · 纯标签驱动 · 原生支持 AI Agent 的开源自托管灵感笔记系统**

*Ditch folders and title friction. Weave thoughts organically across a 3D knowledge mesh at the edge.*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-rose.svg?style=flat-square)](./LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 SQLite](https://img.shields.io/badge/D1-SQLite_FTS5-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![R2 Storage](https://img.shields.io/badge/R2-Object_Storage-F6821F?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Local-First](https://img.shields.io/badge/Local--First-Dexie_IndexedDB-10B981?style=flat-square)](https://dexie.org/)
[![MCP Ready](https://img.shields.io/badge/MCP-Protocol_Ready-8B5CF6?style=flat-square)](https://modelcontextprotocol.io/)

<br/>

[🌐 Live Demo Experience](https://tagmesh.top) • [🇨🇳 简体中文](./README_CN.md) • [🇬🇧 English](./README.md) • [🚀 Quick Deploy](#-quick-deployment) • [🤖 MCP AI Setup](#-ai-agent--mcp-integration)

</div>

---

> 💡 **Serverless & 100% Free Forever**  
> TagMesh operates entirely within Cloudflare's free tiers (Workers + D1 + R2) with zero VPS maintenance and zero egress bandwidth costs.

---

## 💡 Why TagMesh? (Why TagMesh)

Traditional note-taking tools often inflict heavy **cognitive friction** before you can even begin writing:

* 🌲 **Folder-Heavy Apps (Obsidian / Notion / Evernote)**: You are forced to pick a folder and invent a title beforehand. This rigid friction kills fleeting sparks of inspiration.
* 🔒 **Commercial Memo Tools (Flomo / Yuque)**: Your data is locked in proprietary third-party clouds with expensive subscriptions and zero native AI Agent connectivity.
* 📄 **Plain Text Markdown Tools**: Monolithic, flat, and lacking tactile delight or multi-dimensional visual roaming.

**TagMesh solves this fundamentally:**
1. **Zero Folders · Zero Titles**: Your thoughts are raw Markdown streams. Organization is powered entirely by `#hashtags` typed anywhere in the text.
2. **Dual Immersive Gallery Views**: Seamlessly switch between Bento Masonry Waterfall (column-bucketing layout) and Chronological Timeline Stream (floating time-ruler scrubber with full rich content).
3. **Local-First & Zero-Delay**: 0-millisecond offline local response via IndexedDB, backed by silent debounced syncing to your private Cloudflare D1 + R2 edge.
4. **🤖 Telegram Second Brain Bot**: Message your private Telegram bot from anywhere (text, photos, interspersed tags); instant zero-delay sync into your knowledge base.
5. **Native AI-Native MCP Gateway**: Built-in Model Context Protocol (MCP) server allowing Claude Desktop, Cursor, and AI Agents to query, create, and weave your notes.

> 💡 **Recommended Workflow:**  
> Use **TagMesh** as your universal inbox on any device to capture fleeting thoughts. Chat with your Telegram bot on the go, and connect **TagMesh MCP** to Claude Desktop or Cursor so your AI assistant can distill tags, organize knowledge clusters, or generate synthesis reports on command.

---

## 🏛️ System Architecture

TagMesh is built on a modern **Local-First Web Client + Serverless Cloudflare Edge** dual-engine architecture:

```mermaid
flowchart TD
    subgraph Client ["💻 Local-First Web Client"]
        UI["🎨 3D Tactile UI / 5 Gallery Views"]
        TipTap["✍️ TipTap Rich-Text Editor / #Hashtag Autocomplete"]
        DexieDB[("💾 Dexie.js (IndexedDB Instant Local Storage)")]
        AudioConfetti["🔊 Acoustic Tactile Sound Effects & Particle Engine"]
        
        UI <--> TipTap
        TipTap <--> DexieDB
        UI -.-> AudioConfetti
    end

    subgraph CloudflareEdge ["☁️ Cloudflare Global Edge Network (tagmesh.top)"]
        Worker["⚡ Cloudflare Workers (Hono REST & MCP Gateway)"]
        D1[("🗄️ Cloudflare D1 (SQLite + FTS5 Search Engine)")]
        R2[("📦 Cloudflare R2 (Zero-Egress Image Hosting & Cloud Snapshots)")]
        Assets["🌐 Cloudflare Static Assets (SPA Edge CDN)"]

        Worker <--> D1
        Worker <--> R2
    end

    subgraph AIAgents ["🤖 AI Agent Ecosystem (MCP Clients)"]
        Claude["Claude Desktop / Cursor"]
        Antigravity["Antigravity / OpenClaw"]
    end

    DexieDB <-- "1.5s Debounced Silent Delta Sync" --> Worker
    TipTap <-- "Ctrl+V Screenshot Direct Upload to R2" --> Worker
    AIAgents <-- "JSON-RPC / Bearer Auth MCP Protocol" --> Worker
```

---

## ✨ Key Features

### 1. 🏷️ Zero-Folder Tag-Mesh
- Eliminate rigid folder trees. The first sentence is automatically distilled into an aesthetic card excerpt.
- Typing `#` triggers an instant hashtag autocomplete menu; clicking any tag aggregates related cards instantly.

### 2. 🧭 Dual Gallery Views
- **🍱 Bento Grid**: True column-bucketing adaptive masonry waterfall with zero vertical gaps and deterministic left-to-right flow, rendering 100% full content with syntax-highlighted code blocks.
- **📜 Timeline Stream**: Chronological stream mapping your creative evolution over time with milestone dividers and distraction-free typography.
- **📖 Focus Reader**: Distraction-free, pure Markdown modal reader with instant reactions.

### 3. 📷 Cloudflare R2 Instant Image Hosting & Time-Machine Snapshots
- **Instant Screenshot Upload**: Paste screenshots directly with <kbd>Ctrl</kbd> + <kbd>V</kbd> or drag-and-drop images. Uploaded directly to R2 with zero egress fees and edge CDN caching.
- **1-Click Full Cloud Snapshots**: Backup the entire local IndexedDB database to R2 from the Admin Console; review revision history and restore in 1 click.

### 4. 👑🌱 Dual-Track Curator & Guest Tag Isolation
- **Role-Scoped Tag Pools**: Switching between "All", "Curator", and "Guest" tabs dynamically recalculates tag frequencies scoped strictly to the active author role.
- **Smart Auto-Fallback**: If an active tag does not exist under the target role, the system smoothly resets to `#all`, preventing empty state breaks.

---

## 🚀 Quick Deployment

### Option A: Deploy with an AI Agent (Recommended)

Send this prompt directly to any AI coding assistant (Claude Code, Cursor, Antigravity, OpenClaw, etc.):

```text
Deploy TagMesh online:
1. Fork https://github.com/SaulGoodManC99/TagMesh
2. Connect to Cloudflare Workers & Pages build
3. Create D1 database `tagmesh-db` and R2 bucket `tagmesh-bucket`, execute `schema.sql`
4. Deploy and verify https://your-domain.workers.dev/api/health and /mcp
```

### Option B: 3-Step Manual CLI Deployment

```bash
# 1. Clone repo & install dependencies
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh && npm install

# 2. Initialize Cloudflare D1 Database & R2 Bucket
npx wrangler d1 create tagmesh-db
npx wrangler r2 bucket create tagmesh-bucket
npx wrangler d1 execute tagmesh-db --file=./schema.sql --remote

# 3. Build and deploy to the global edge
npm run build
npx wrangler deploy
```

---

## 🤖 AI Agent / MCP Configuration (Claude & Cursor)

Add the following to your `claude_desktop_config.json` or Cursor to empower AI with your knowledge mesh:

```json
{
  "mcpServers": {
    "tagmesh": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-domain.workers.dev/mcp",
        "--header",
        "Authorization: Bearer tagmesh_mcp_secret_bearer_token"
      ]
    }
  }
}
```

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> | Create blank note instantly | Global |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Global Command Palette | Global |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Force instant sync to Cloudflare D1 | Global |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>B</kbd> | Toggle left Tag-Mesh sidebar | Global |
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd> | Cycle to next mood color theme | Global |
| <kbd>?</kbd> | Open keyboard shortcuts help modal | Global |

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Contributions, issues, and ideas are warmly welcome!

