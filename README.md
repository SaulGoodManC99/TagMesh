<div align="center">

# 🌸 TagMesh

### **Zero-Folder · Titleless · Tag-Woven Markdown Journal with Claymorphic Aesthetics & Serverless Edge**

*Ditch folders and titles. Weave thoughts organically through `#hashtags` at the edge.*

<br/>

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0.9-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 SQLite + FTS5](https://img.shields.io/badge/D1-SQLite_FTS5-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Local-First Dexie](https://img.shields.io/badge/Local--First-Dexie_IndexedDB-10B981?style=for-the-badge)](https://dexie.org/)
[![MCP Ready](https://img.shields.io/badge/MCP-JSON--RPC_2.0-8A2BE2?style=for-the-badge)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](./LICENSE)

<br/>

[📖 Design Origin & Philosophy](#-design-origin--philosophy) • [✨ Feature Matrix](#-core-feature-matrix) • [🎨 6 Mood Themes](#-6-dimensional-mood-themes) • [🧭 6 Galleries](#-6-multi-dimensional-knowledge-galleries) • [⚡ Shortcuts](#-keyboard-first-shortcuts) • [☁️ Cloudflare Deployment](#️-complete-step-by-step-cloudflare-deployment-guide) • [🤖 MCP AI Server](#-model-context-protocol-mcp-server)

<br/>

[🇬🇧 English](./README.md) • [🇨🇳 简体中文](./README_CN.md)

---

</div>

<br/>

> [!TIP]
> **💡 Recommended GitHub Repository Settings**
> - **About**: `🌸 Zero-folder, titleless, keyboard-driven Markdown journal with Claymorphic aesthetics & serverless edge. Features live Danmaku plaza, 6 dimensional galleries, and Model Context Protocol (MCP) server.`
> - **Topics**: `markdown`, `claymorphism`, `local-first`, `tiptap`, `cloudflare-workers`, `cloudflare-d1`, `mcp-server`, `react19`, `tailwindcss4`, `notes-app`, `danmaku`

---

## 📖 Design Origin & Philosophy

When using traditional note-taking apps (Notion, Obsidian, Logseq, Apple Notes), digital gardening is frequently disrupted by **three chronic friction points**:

```
       #travel                     #ideas
          \                         /
           \------- [ Pure Note ] --/
          /         /      \       \
   #photography    /        \     #cloudflare
                  /          \
             #journal       #todo
```

1. **Title Writer's Block**: Before jotting down a quick spark of inspiration, you are forced to invent a "suitable" title. The flow stops before it even begins.
2. **The Folder Labyrinth**: Directory structures quickly grow into complex deep trees like `Work/2026/ProjectX/MeetingNotes`. Notes get buried in folders and forgotten.
3. **AI Bloat & Cold Design**: Editor canvases are cluttered with in-app AI completion popups, and stark monochrome interfaces lack tactile inspiration and emotional warmth.

### 🌸 The TagMesh Solution:
- **Zero Titles & Zero Folders**: Treat notes as fluid Markdown text streams. The first line automatically renders into a concise preview card;
- **Pure `#Hashtag` Topology Mesh**: Scatter `#tags` anywhere in your text. Notes organically weave into bidirectional knowledge galaxies;
- **Claymorphic Tactile Aesthetics**: Rounded spatial relief shadows, auditory soundscapes, particle bursts, a cross-device live Danmaku plaza, and 6 dimension galleries;
- **Clean Serverless MCP Gateway**: Zero in-app AI noise. Natively exposes standard MCP tools for Claude Desktop and Cursor.

---

## ✨ Core Feature Matrix

<table>
  <tr>
    <td width="50%">
      <h3>🏷️ Zero Titles & Zero Folders</h3>
      <p>Ditch directory trees. Scatter <code>#hashtags</code> anywhere in raw Markdown. Tiptap renders tags as interactive clay pills, and typing <code>#</code> triggers instant autocomplete.</p>
    </td>
    <td width="50%">
      <h3>🎨 Tactile Claymorphism Aesthetics</h3>
      <p>Rounded spatial relief buttons, tactile micro-interactions, playful auditory feedback, confetti particle bursts, and 6 curated mood themes.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>💬 Cross-Device Shared Danmaku Plaza</h3>
      <p>Broadcast thoughts across screens in real time. Danmakus launched from mobile fly across desktop monitors with reaction hearts 💖 and multi-lane collision avoidance.</p>
    </td>
    <td width="50%">
      <h3>⏱️ Real Backend Uptime & Authoritative Telemetry</h3>
      <p>Synchronized backend startup timestamp (<code>SYSTEM_START_TIME</code>) displayed across devices with zero reset on refresh; authoritative session deduplicated visit counting.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🧭 6 Multi-Dimensional Galleries</h3>
      <p>Switch seamlessly between <b>Bento Grid</b>, <b>3D Spatial Carousel</b>, <b>Galaxy Mesh Graph</b>, <b>Polaroid Board</b>, <b>Timeline Stream</b>, and <b>Freeform Canvas</b>.</p>
    </td>
    <td width="50%">
      <h3>🤖 Native Serverless MCP AI Toolset</h3>
      <p>Edge-native Model Context Protocol (JSON-RPC 2.0) interface with 8 production tools ready for <b>Claude Desktop</b> and <b>Cursor</b>.</p>
    </td>
  </tr>
</table>

---

## 🎨 6 Dimensional Mood Themes

Switch effortlessly between 6 curated atmospheric themes:

| Theme | Atmosphere | Palette / Accent | Ideal Mood |
| :--- | :--- | :--- | :--- |
| 🌸 **Sakura Snow** | Drifting cherry blossoms and soft blush hues | `#FFF5F7` · Soft Blush | Daily journaling & reflections |
| 🌊 **Deep Ocean** | Abyssal oceanic blue and rhythmic sea foam | `#F0F9FF` · Cyan Abyss | Deep thinking & architecture |
| 🍵 **Zen Matcha** | Early spring tea gardens with organic herbal greens | `#F2FBF5` · Organic Herb | Reading notes & morning reviews |
| 🌌 **Cosmic Nebula** | Deep space stardust and violet astral trails | `#FDF4FF` · Astral Violet | Brainstorming & creativity |
| 👑 **Gilded Palace** | Imperial amber warmth and velvet elegance | `#FFFBEB` · Warm Amber | Milestone summaries & archiving |
| 🍦 **Vanilla Paper** | Tactile cream paper stationery with retro warmth | `#FAF7F2` · Retro Paper | Minimalist writing & vintage essays |

---

## 🧭 6 Multi-Dimensional Knowledge Galleries

| Gallery View | Interaction Highlights | Best Use Case |
| :--- | :--- | :--- |
| **🗂️ Bento Grid** | Responsive modern bento layout with instant tag filters and word density tags | Quick vault browsing & tag filtering |
| **🎡 3D Spatial Carousel** | Spatial 3D cylinder rotating card deck with sound feedback and keyboard steering | Immersive card deck flipping |
| **🌌 Galaxy Mesh Graph** | Dynamic force-directed graph visualizing bidirectional relationships between notes | Exploring implicit connections between ideas |
| **🖼️ Polaroid Board** | Vintage pinned photo cards with organic rotation angles and paper clips | Moodboard & visual memories |
| **📅 Timeline Stream** | Chronological river tracking your thinking evolution across time | Thought evolution & history log |
| **🎨 Floating Canvas** | Draggable free-form spatial canvas for spatial brainstorming | Infinite free-form card mapping |

---

## ⚡ Keyboard-First Shortcuts

TagMesh is crafted for power keyboard users:

| Shortcut | Description | Scope |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Open Global Command Central** (FTS5 search & quick create) | Global |
| <kbd>Cmd</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | **Toggle Left TagMesh Slide-over Sidebar** | Global |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Instant Create Blank Note** (100ms ultra-fast response) | Global |
| <kbd>Cmd</kbd> + <kbd>S</kbd> / <kbd>Ctrl</kbd> + <kbd>S</kbd> | **Manual Force Sync to Cloudflare D1** | Global |
| <kbd>#</kbd> | **Trigger Hashtag Autocomplete Menu** | Editor |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **Toggle Bilingual UI** (English / 简体中文) | Global |
| <kbd>Cmd</kbd> + <kbd>/</kbd> / <kbd>Ctrl</kbd> + <kbd>/</kbd> | **Open Keyboard Shortcuts Cheatsheet Modal** | Global |
| <kbd>Esc</kbd> | **Close Modals, Command Palette or Sidebars** | Global |

---

## ☁️ Complete Step-by-Step Cloudflare Deployment Guide

TagMesh is architected for Cloudflare's serverless edge ecosystem (**Workers + D1 SQLite Database**), offering zero maintenance and global sub-second latencies.

Choose between **two deployment routes**:
- 🌟 **Route 1: Automated GitHub Actions CI/CD (Recommended, Zero Hassle)**
- 💻 **Route 2: Local CLI Wrangler Deployment (For Developers)**

---

### 🌟 Route 1: Automated GitHub Actions CI/CD (Recommended)

Whenever you `git push` to your repository, GitHub Actions automatically builds and deploys your updates to Cloudflare Edge in ~30 seconds!

#### 1. Create D1 Database on Cloudflare
1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/);
2. Navigate to **Storage & Databases** -> **D1 SQL Database**;
3. Click **Create database**, enter `tagmesh-db`;
4. Copy the generated **Database ID** (a UUID like `132a4651-9da7-4fb8-8e17-11ffb4354d10`);
5. Open the database detail page -> **Console**, copy and paste the contents of [`schema.sql`](./schema.sql), and click **Execute**.

#### 2. Obtain Cloudflare API Token & Account ID
- **API Token**: Click your profile icon -> **My Profile** -> **API Tokens** -> **Create Token** -> Use **Edit Cloudflare Workers** template to create and copy your Token;
- **Account ID**: Go to the Cloudflare dashboard homepage and copy your **Account ID** from the right sidebar.

#### 3. Configure 3 GitHub Repository Secrets
In your GitHub repo -> **Settings** -> **Secrets and variables** -> **Actions** -> Click **New repository secret**:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Generated API Token | Grants deployment permissions to GitHub Actions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID | Your Cloudflare account identifier |
| `CLOUDFLARE_D1_DATABASE_ID` | Your D1 Database ID (UUID) | Secretly binds your D1 Database without exposing it in public code |

🎉 **Done!** Every `git push` to `main` now automatically triggers full build and deployment to Cloudflare Workers!

---

### 💻 Route 2: Local CLI Wrangler Deployment

For developers who prefer terminal-driven deployment:

```bash
# 1. Clone repo & install dependencies
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh
npm install

# 2. Login to Cloudflare CLI
npx wrangler login

# 3. Create remote D1 database
npx wrangler d1 create tagmesh-db
# Paste the output database_id into wrangler.toml

# 4. Initialize remote database tables and FTS5 indexes
npm run db:init:remote

# 5. Build bundle and deploy worker
npm run build
npm run worker:deploy
```

Your live URL will be printed in the terminal:  
`https://tagmesh-markdown.<your-subdomain>.workers.dev`

---

### 🌐 Custom Domain Binding (Optional)
1. In [Cloudflare Dashboard](https://dash.cloudflare.com/);
2. Go to **Workers & Pages** -> **tagmesh-markdown**;
3. Go to **Settings** -> **Domains & Routes** -> **Add Custom Domain** (e.g. `notes.yourdomain.com`).

---

## 🤖 Model Context Protocol (MCP) Server

TagMesh provides an edge **Model Context Protocol (JSON-RPC 2.0)** endpoint at `/mcp`.

### 🛠️ 8 Production-Ready MCP Tools

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `search_by_tag` | Search notes filtered by a specific hashtag | `tag` (string), `limit` (number) |
| `search_fulltext` | Execute high-performance SQLite FTS5 full-text query across all notes | `query` (string), `limit` (number) |
| `read_note` | Retrieve raw Markdown content, tags, and metadata by ID | `id` (string) |
| `create_or_update_note` | Create or overwrite a note stream remotely | `markdown` (string), `tags` (array), `id` (string) |
| `append_to_note` | Append paragraphs or hashtags to an existing note seamlessly | `id` (string), `contentToAppend` (string), `additionalTags` (array) |
| `delete_note` | Soft-delete or archive a note by ID | `id` (string) |
| `list_tags` | Retrieve all unique tags with note count frequencies | None |
| `get_workspace_stats` | Query repository note count, word count, and health metrics | None |

<details>
<summary><b>🔌 Claude Desktop Configuration (Click to expand)</b></summary>

Add to `claude_desktop_config.json`:

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
</details>

<details>
<summary><b>🔌 Cursor / VSCode Cline Configuration (Click to expand)</b></summary>

In Cursor Settings -> Features -> MCP Servers:
- **Type**: `sse` / `http`
- **URL**: `https://your-domain.com/mcp`
</details>

---

## 📄 License

Distributed under the [MIT License](./LICENSE).

<div align="center">

Crafted with 💖 and Clay Magic by **[SaulGoodManC99](https://github.com/SaulGoodManC99)**

</div>
