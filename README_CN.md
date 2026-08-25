<div align="center">

# 🌸 TagMesh
### **Serverless, 100% Free & Open-Source Tag-Driven Markdown Notes on Cloudflare with Native MCP**
### **无需服务器 · 0 费用 · 纯标签驱动 · 原生支持 AI Agent 的开源自托管灵感笔记系统**

*告别文件夹焦虑与起标题内耗，让每一个灵感在 `#标签` 编织的立体知识网中自由绽放。*

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

[🌐 在线演示体验 (Live Demo)](https://tagmesh.top) • [🇨🇳 简体中文](./README_CN.md) • [🇬🇧 English](./README.md) • [🚀 一键部署](#-快速部署-deployment) • [🤖 MCP AI 配置](#-ai-agent--mcp-配置指南)

</div>

---

> 💡 **Serverless 架构与终生 100% 免费**  
> TagMesh 完全运行在 Cloudflare 免费层（Workers + D1 + R2）之内，无需购买 VPS 服务器，零出站流量费用。

---

## 💡 为什么选择 TagMesh？ (Why TagMesh)

在传统笔记工具中，创作者往往在动笔第一秒就陷入了严重的**认知内耗**：

* 🌲 **传统树状笔记 (Obsidian / Notion / Evernote)**：必须先决定“放进哪个文件夹”、起好标题才能写，繁琐的层级关系扼杀了瞬时闪念。
* 🔒 **商业卡片笔记 (Flomo / 语雀)**：数据深锁在第三方商业云端，无法完全掌控数据所有权，且难以被本地 AI Agent 直接调用。
* 📄 **传统纯文本 Markdown**：展示单调枯燥，缺少快速视觉漫游体验与触感乐趣。

**TagMesh 填补了这一空白**：
1. **零文件夹 · 零强制标题**：正文即思维流，在 Markdown 任意位置穿插 `#标签` 自动编织高维知识网。
2. **双重沉浸式画廊漫游展台**：🍱 便当瀑布流（响应式多列分桶，无缝紧凑贴合）与 📜 时光卷轴（右侧悬浮时光标尺、100% 富文本直接铺开阅读）。
3. **本地优先 (Local-First) 秒开**：基于 IndexedDB 实现 0 毫秒离线极速响应，后台静默增量同步至私有 Cloudflare D1 + R2。
4. **🤖 Telegram 闪念同步机器人**：在 Telegram 中随时向专属 Bot 发送文字、图片或随手记，0 延迟自动入库第二大脑。
5. **原生 AI-Native MCP 网关**：内置 Model Context Protocol，Claude Desktop、Cursor 与各类 AI Agent 可直接读写检索全库。

> 💡 **推荐工作流 (Recommended Workflow):**  
> 将 **TagMesh** 作为跨设备灵感与闪念的第一收集站。在 Telegram 中随时随手记录，在 Claude Desktop 或 Cursor 中接入 **TagMesh MCP**，让 AI 助手直接帮你归纳整理标签网、梳理思考脉络或一键生成总结周报。

---

## 🏛️ 系统架构 (Architecture)

TagMesh 采用 **Local-First（本地优先）+ Cloudflare Serverless Edge（全球边缘服务）** 的双核架构：

```mermaid
flowchart TD
    subgraph Client ["💻 本地优先客户端 (Local-First Web Client)"]
        UI["🎨 3D 拟物 UI / 5 大画廊展台"]
        TipTap["✍️ TipTap 富文本编辑器 / #标签智能补全"]
        DexieDB[("💾 Dexie.js (IndexedDB 本地毫秒级持久化)")]
        AudioConfetti["🔊 物理触感音效 & 粒子交互"]
        
        UI <--> TipTap
        TipTap <--> DexieDB
        UI -.-> AudioConfetti
    end

    subgraph CloudflareEdge ["☁️ Cloudflare 全球边缘网络 (tagmesh.top)"]
        Worker["⚡ Cloudflare Workers (Hono REST & MCP 路由)"]
        D1[("🗄️ Cloudflare D1 (SQLite + FTS5 全文检索)")]
        R2[("📦 Cloudflare R2 (零流量费图床 & 全库快照)")]
        Assets["🌐 Cloudflare Static Assets (SPA 边缘分发)"]

        Worker <--> D1
        Worker <--> R2
    end

    subgraph AIAgents ["🤖 AI Agent 生态 (MCP Clients)"]
        Claude["Claude Desktop / Cursor"]
        Antigravity["Antigravity / OpenClaw"]
    end

    DexieDB <-- "1.5s 防抖无声增量同步" --> Worker
    TipTap <-- "Ctrl+V 截图即刻直传 R2" --> Worker
    AIAgents <-- "JSON-RPC / Bearer 鉴权标准 MCP 协议" --> Worker
```

---

## ✨ 核心特性 (Key Features)

### 1. 🏷️ 纯标签网状编织 (Zero-Folder Tag-Mesh)
- 彻底摒弃层级文件夹，首行自动提炼为卡片摘要。
- 键入 `#` 自动唤起智能标签补全菜单，标签点击即刻聚合关联灵感。

### 2. 🧭 双重视角画廊展台 (Dual Gallery Views)
- **🍱 便当瀑布流 (Bento Grid)**：真·多列分桶自适应瀑布流，卡片上下紧密贴合（零空白缝隙），严格按从左到右自然排布，100% 完整呈现正文与代码块。
- **📜 时光卷轴 (Timeline Stream)**：按时间轴纵向流淌的心路历程，月份里程碑与深度沉浸阅读。
- **📖 纯粹聚焦阅读 (Focus Reader)**：纯净无干扰 Markdown 弹窗深度阅读与点赞互动。

### 3. 📷 Cloudflare R2 极速图床与全库时光机
- **截图即刻秒传**：编辑器内支持 <kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴截图与拖拽图片，直传 R2 存储桶，享全球 CDN 加速与零出站流量费。
- **一键全库快照**：管理控制台支持一键将本地全库笔记备份至 R2，随时支持历史版本回溯与一键时光机恢复。

### 4. 👑🌱 馆长精选与旅人随笔双轨隔离
- **独立标签池与计数**：切换「全部 / 馆长精选 / 旅人笔记」时，标签栏实时呈现当前角色拥有的标签与独立统计。
- **智能平滑退避**：切换角色时，若所选标签在目标视图下不存在，系统自动平滑重置为 `#all`，杜绝空态断层。

---

## 🚀 快速部署 (Deployment)

### 选项 A：使用 AI Agent 一键部署（推荐）

将以下提示词直接发送给 AI 编码助手（如 Claude Code, Cursor, Antigravity, OpenClaw 等）：

```text
帮我在线部署 TagMesh 笔记系统：
1. Fork 仓库 https://github.com/SaulGoodManC99/TagMesh
2. 绑定至 Cloudflare Workers & Pages 构建
3. 创建 D1 数据库 `tagmesh-db` 与 R2 存储桶 `tagmesh-bucket`，执行 `schema.sql`
4. 部署并验证 https://your-domain.workers.dev/api/health 与 /mcp
```

### 选项 B：手动 3 步命令行部署

```bash
# 1. 克隆项目与安装依赖
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh && npm install

# 2. 初始化 Cloudflare D1 数据库与 R2 存储桶
npx wrangler d1 create tagmesh-db
npx wrangler r2 bucket create tagmesh-bucket
npx wrangler d1 execute tagmesh-db --file=./schema.sql --remote

# 3. 构建并发布到全球边缘
npm run build
npx wrangler deploy
```

---

## 🤖 AI Agent / MCP 配置指南 (Claude & Cursor)

在 `claude_desktop_config.json` 或 Cursor 中添加以下配置，AI 即可直接读写检索你的笔记：

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

## ⌨️ 快捷键速查 (Keyboard Shortcuts)

| 快捷键 | 功能描述 |
| :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> | 新建空白灵感笔记 |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | 唤起全局全局指令面板 (Command Palette) |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | 强制立即同步至 Cloudflare D1 |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>B</kbd> | 展开 / 折叠左侧侧边栏 |
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd> | 切换下一套心境色彩主题 |
| <kbd>?</kbd> | 打开快捷键帮助面板 |

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](./LICENSE) 开源协议。欢迎提交 PR 与 Issue 一同共建！
