<div align="center">

# 🌸 TagMesh

### **Zero-Folder · Titleless · Tag-Woven Markdown Notes System with Claymorphic Aesthetics & Serverless Edge**

*Ditch folders and titles. Weave thoughts organically through `#hashtags` at the edge.*

<br/>

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 SQLite + FTS5](https://img.shields.io/badge/D1-SQLite_FTS5-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Local-First](https://img.shields.io/badge/Local--First-Dexie_IndexedDB-10B981?style=flat-square)](https://dexie.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](./LICENSE)

<br/>

[🇬🇧 English](./README.md) • [🇨🇳 简体中文](./README_CN.md)

</div>

---

## ✨ Key Features

- 🏷️ **Zero Titles & Zero Folders**: Treat notes as fluid Markdown streams. Categorization relies purely on `#hashtags` with automatic first-line excerpt summaries.
- 🎨 **Tactile Claymorphism Aesthetics**: Rounded clay pills, spatial relief shadows, auditory soundscapes, particle bursts, and 6 curated mood themes.
- 💬 **Cross-Device Shared Danmaku Plaza**: Thoughts sent from mobile fly across desktop monitors in real time with synchronized reaction hearts and authoritative telemetry.
- 🧭 **6 Multi-Dimensional Galleries**: Bento Grid, 3D Spatial Carousel, Galaxy Mesh Graph, Polaroid Board, Timeline Stream, and Freeform Canvas.
- 🤖 **Native Serverless MCP Interface**: Edge-native Model Context Protocol (JSON-RPC 2.0) interface with 8 production tools ready for Claude Desktop and Cursor.

---

## ⚡ Essential Shortcuts

| Shortcut | Description | Scope |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Open Global Command Central** (Fulltext search & quick create) | Global |
| <kbd>Cmd</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | **Toggle Left TagMesh Slide-over Sidebar** | Global |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Instant Create Blank Note** (100ms response) | Global |
| <kbd>#</kbd> | **Trigger Hashtag Autocomplete Menu** | Editor |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **Toggle Bilingual UI** (English / 简体中文) | Global |

---

## 🚀 Quick Local Development

```bash
# 1. Clone repo & install dependencies
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh
npm install

# 2. Start frontend dev server (with LAN access on 0.0.0.0:5173)
npm run dev

# 3. Start Cloudflare Worker backend locally
npm run worker:dev
```

---

## ☁️ Cloudflare Deployment Guide

TagMesh runs on **Cloudflare Workers + D1 SQLite Database**:

### 1. Create D1 Database
Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **D1 SQL Database** -> **Create database** (name it `tagmesh-db`), copy your **Database ID**, and paste the contents of [`schema.sql`](./schema.sql) into its **Console** to initialize tables.

### 2. Configure GitHub Actions Auto-Deployment (Recommended)
Add 3 secrets in your GitHub repo **Settings** -> **Secrets and variables** -> **Actions**:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `CLOUDFLARE_D1_DATABASE_ID`: D1 Database ID from Step 1

> Every `git push` to `main` now automatically builds and deploys to Cloudflare Edge in ~30 seconds!

### 3. Local CLI Deployment (Optional)
```bash
npx wrangler login
npm run db:init:remote
npm run build
npm run worker:deploy
```

---

## 🤖 MCP (Model Context Protocol) Integration

Add to your **Claude Desktop** configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tagmesh": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://your-domain.com/mcp"
      ]
    }
  }
}
```

Available tools: `search_by_tag`, `search_fulltext`, `read_note`, `create_or_update_note`, `append_to_note`, `delete_note`, `list_tags`, `get_workspace_stats`.

---

## 📄 License

Distributed under the [MIT License](./LICENSE).

<div align="center">

Crafted with 💖 and Clay Magic by **[SaulGoodManC99](https://github.com/SaulGoodManC99)**

</div>
