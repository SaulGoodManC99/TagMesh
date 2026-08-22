<div align="center">

# 🌸 TagMesh 灵感手账

### **无文件夹 · 无标题 · 依托 `#标签` 网状编织的粘土拟物风 Markdown 灵感手账**

*Ditch folders and titles. Weave thoughts organically through `#hashtags` at the edge.*

<br/>

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 SQLite + FTS5](https://img.shields.io/badge/D1-SQLite_FTS5-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Local-First](https://img.shields.io/badge/Local--First-Dexie_IndexedDB-10B981?style=flat-square)](https://dexie.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](./LICENSE)

<br/>

[🇨🇳 简体中文](./README_CN.md) • [🇬🇧 English](./README.md)

</div>

---

## ✨ 核心特性

- 🏷️ **零标题 & 零文件夹（Zero Folders & Titles）**：以纯粹 Markdown 文本流为核心，分类全靠正文中的 `#标签`，首行自动提炼为精致摘要卡片。
- 🎨 **粘土拟物美学（Claymorphism）**：圆润饱满的胶囊微交互、物理浮雕投影、清脆敲击音效、粒子爆发与 6 套心境次元主题。
- 💬 **跨设备实时弹幕广场**：手机端发射的弹幕即刻飞过电脑屏幕，爱心点赞跨端广播，具备真实后台运行时间与会话去重访客统计。
- 🧭 **6 大多维知识展厅**：支持 Bento 拼图、3D 空间立体轮播、银河知识拓扑星网、拍立得照片墙、时光长河纪年与自由画布。
- 🤖 **原生 Serverless MCP 接口**：边缘端开放 8 大标准 AI 工具，零内置 AI 杂音，一键对接 Claude Desktop 与 Cursor。

---

## ⚡ 常用快捷键

| 快捷键 | 功能说明 | 触发场景 |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | **唤起全局命令中枢**（全文检索 / 输入直接回车建笔记） | 全局 |
| <kbd>Cmd</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | **展开 / 收起左侧纯标签聚合侧边栏** | 全局 |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | **极速新建空白手账**（100ms 快速响应） | 全局 |
| <kbd>#</kbd> | **键入 `#` 自动唤起已有标签智能补全菜单** | 编辑器内 |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **一键切换中英文双语界面**（English / 简体中文） | 全局 |

---

## 🚀 极速本地运行

```bash
# 1. 克隆仓库并安装依赖
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh
npm install

# 2. 启动前端开发服务器（支持局域网 0.0.0.0:5173 真机访问）
npm run dev

# 3. 启动 Cloudflare Worker 后端守护服务
npm run worker:dev
```

---

## ☁️ Cloudflare 极简部署指南

TagMesh 依托 **Cloudflare Workers + D1 SQLite 数据库** 运行：

### 1. 创建 D1 数据库
在 [Cloudflare 控制台](https://dash.cloudflare.com/) -> **D1 SQL Database** -> **Create database**（名称填 `tagmesh-db`），复制生成的 **Database ID**，并在该数据库的 **Console** 中粘贴执行项目根目录的 [`schema.sql`](./schema.sql)。

### 2. 配置 GitHub Actions 自动部署（推荐）
在 GitHub 仓库 **Settings** -> **Secrets and variables** -> **Actions** 添加 3 个密钥：
- `CLOUDFLARE_API_TOKEN`：Cloudflare API 令牌
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID
- `CLOUDFLARE_D1_DATABASE_ID`：步骤 1 复制的 D1 Database ID

> 以后向 `main` 分支执行 `git push`，GitHub Actions 就会在 30 秒内全自动编译发布上线！

### 3. 本地命令行直接发布（可选）
```bash
npx wrangler login
npm run db:init:remote
npm run build
npm run worker:deploy
```

---

## 🤖 MCP（Model Context Protocol）对接

在 **Claude Desktop** 配置文件（`claude_desktop_config.json`）中添加：

```json
{
  "mcpServers": {
    "tagmesh": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://你的线上域名/mcp"
      ]
    }
  }
}
```

开放工具：`search_by_tag`、`search_fulltext`、`read_note`、`create_or_update_note`、`append_to_note`、`delete_note`、`list_tags`、`get_workspace_stats`。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 协议开源。

<div align="center">

Crafted with 💖 and Clay Magic by **[SaulGoodManC99](https://github.com/SaulGoodManC99)**

</div>
