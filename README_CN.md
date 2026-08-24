<div align="center">

# 🌸 TagMesh 灵感笔记系统
### **纯标签驱动 · 3D 黏土拟物美学 · 混合端边缘灵感知识网**

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

[🌐 在线演示体验 (Live Demo)](https://tagmesh.top) • [🇨🇳 简体中文](./README_CN.md) • [🇬🇧 English](./README.md)

</div>

---

## 💡 为什么选择 TagMesh？

传统笔记工具总是强迫我们在动笔前做选择：**“建在哪个文件夹？”、“标题起什么？”**。这种沉重的心智负担往往在灵感刚萌芽时就将其扼杀。

**TagMesh 彻底打破这一束缚：**
- **零标题 · 零文件夹**：正文即思维流，分类全靠正文随处键入的 `#标签`。
- **3D 黏土拟物交互**：饱满柔和的圆角浮雕、清脆的物理敲击音效、灵动的粒子碰撞与心境主题。
- **本地优先 + 全球边缘服务**：IndexedDB 零毫秒无锁瞬时响应，后台静默增量同步至 Cloudflare D1 + R2，离线断网照样流畅书写。
- **AI 原生集成**：内置 Serverless MCP 端点，让 Claude、Cursor 等 AI 助手直接读取、搜索和编织你的笔记网。

---

## 🏛️ 系统架构 (Architecture)

TagMesh 采用 **Local-First（本地优先）+ Cloudflare Edge Serverless（边缘无服务器）** 的双核现代架构：

```mermaid
flowchart TD
    subgraph Client ["💻 本地优先客户端 (Local-First Web App)"]
        UI["🎨 3D 黏土拟物 UI / 5 种笔记展示模式"]
        TipTap["✍️ TipTap 富文本编辑器 / #标签智能补全"]
        DexieDB[("💾 Dexie.js (IndexedDB 本地瞬时持久化)")]
        AudioConfetti["🔊 物理触觉音效 & 粒子引擎"]
        
        UI <--> TipTap
        TipTap <--> DexieDB
        UI -.-> AudioConfetti
    end

    subgraph CloudflareEdge ["☁️ Cloudflare 全球边缘网络 (tagmesh.top)"]
        Worker["⚡ Cloudflare Workers (Hono REST & MCP Gateway)"]
        D1[("🗄️ Cloudflare D1 (SQLite + FTS5 全文检索引擎)")]
        R2[("📦 Cloudflare R2 (零出口费图床 & 全库时光机快照)")]
        Assets["🌐 Cloudflare Static Assets (SPA 边缘分发)"]

        Worker <--> D1
        Worker <--> R2
    end

    subgraph AIAgents ["🤖 AI Agent 生态 (MCP Clients)"]
        Claude["Claude Desktop"]
        Cursor["Cursor IDE"]
        Windsurf["Windsurf / Cline"]
    end

    DexieDB <-- "1.5s 防抖无声增量双向同步" --> Worker
    TipTap <-- "Ctrl+V 截图即刻秒传" --> Worker
    AIAgents <-- "JSON-RPC / Bearer 鉴权标准协议" --> Worker
```

---

## ✨ 核心特性一览

### 1. 🏷️ 纯标签网状编织 (Zero-Folder Tag-Mesh)
- 丢弃复杂的目录树，首行文字自动提炼为卡片摘要。
- 键入 `#` 自动唤起智能标签补全菜单，标签点击即刻聚合关联灵感。

### 2. 🧭 5 种沉浸式笔记展示模式 (5 Note Views)
- **🍱 Bento 便当网格**：自适应非对称卡片瀑布流，信息层级错落有致。
- **📷 拍立得照片墙**：拟物拍立得便签质感，胶带固定与微倾斜摆放。
- **🎠 3D 旋转木马**：立体空间环形画廊，支持鼠标滚轮与手势平滑旋转。
- **📜 时光卷轴轴线**：按时间维度编排灵感心路历程。
- **🌌 灵感漂流画布**：失重微浮动卡片世界，随风轻拂。

### 3. 📷 Cloudflare R2 极速图床与时光机快照
- **截图即刻秒传**：编辑器内支持 <kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴截图与拖拽外部图片，直传 R2 存储桶，享全球 CDN 边缘加速与零出站流量费。
- **一键云端快照**：馆长控制台支持一键将本地全库笔记打包备份至 R2，并支持随时查看历史版本与一键时光机恢复。

### 4. 👑🌱 馆长精选与旅人笔记双轨独立隔离
- **标签池与篇数隔离**：切换「全部 / 馆长精选 / 旅人笔记」时，标签栏实时呈现当前角色拥有的标签，同名标签各自独立统计。
- **智能平滑退避**：切换角色时，若所选标签在目标视图下不存在，系统自动平滑重置为 `#all`，杜绝空态断层。

### 5. 🤖 原生 Serverless MCP 协议服务
- 边缘端提供 8 大标准化 AI 工具（创建、搜索、聚合标签、全库同步、时光机备份等）。
- 零客户端插件，通过统一 Bearer Token 鉴权，轻松对接 Claude Desktop、Cursor 及各大 AI Agent。

### 6. 💬 跨端实时互动广场
- 跨设备实时弹幕广播、爱心爪印点赞、真实系统运行时长与去重访客统计。

---

## ⚡ 常用快捷键 (Keyboard Shortcuts)

| 快捷键 | 功能说明 | 适用场景 |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | **唤起全局命令中枢**（全文检索 / 输入直接回车建笔记） | 全局 |
| <kbd>Cmd</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | **展开 / 收起左侧纯标签聚合侧边栏** | 全局 |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | **极速新建空白笔记**（100ms 瞬时响应） | 全局 |
| <kbd>#</kbd> | **键入 `#` 自动唤起已有标签智能补全菜单** | 编辑器内 |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | **粘贴剪贴板截图直接秒传至 R2 图床** | 编辑器内 |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **一键切换中英文双语界面**（English / 简体中文） | 全局 |

---

## 🚀 极速本地开发 (Local Development)

### 1. 克隆仓库与安装依赖
```bash
git clone https://github.com/SaulGoodManC99/TagMesh.git
cd TagMesh
npm install
```

### 2. 启动前端开发服务器
```bash
npm run dev
# 访问 http://localhost:5173 (支持局域网设备跨端访问)
```

### 3. 启动 Cloudflare Worker 本地模拟服务
```bash
npm run worker:dev
# 边缘 API 服务运行在 http://localhost:8787
```

---

## ☁️ Cloudflare 生产环境一键部署指南

TagMesh 完全基于 Cloudflare 免费层（Workers + D1 + R2 + Static Assets）设计，零服务器运维成本。

### 步骤 1：登录 Cloudflare Wrangler CLI
```bash
npx wrangler login
```

### 步骤 2：创建 D1 数据库并初始化表结构
```bash
# 1. 创建 D1 数据库
npx wrangler d1 create tagmesh-db

# 2. 执行建表脚本（创建笔记表、FTS5 全文索引、系统遥测与弹幕表）
npx wrangler d1 execute tagmesh-db --remote --file=./schema.sql
```
> 💡 创建成功后，Wrangler 会输出 `database_id`，请确保将其更新至 `wrangler.toml` 中的 `database_id` 字段。

### 步骤 3：创建 R2 对象存储桶
```bash
# 创建 R2 存储桶 (推荐亚太 apac 区域)
npx wrangler r2 bucket create tagmesh-bucket --location=apac
```

### 步骤 4：确认 `wrangler.toml` 配置
确保项目根目录下的 [`wrangler.toml`](./wrangler.toml) 配置如下：
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
database_id = "你的_D1_DATABASE_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "tagmesh-bucket"

[vars]
ENVIRONMENT = "production"
MCP_AUTH_TOKEN = "tagmesh_mcp_secret_bearer_token"
```

### 步骤 5：构建与全量部署上线
```bash
# 1. 编译前端生产静态资源
npm run build

# 2. 一键发布 Worker 与静态资源至 Cloudflare
npx wrangler deploy
```

### 步骤 6：绑定自定义域名（可选）
在 [Cloudflare 控制台](https://dash.cloudflare.com/) 中：
1. 进入 **Workers & Pages** -> 点击 `tagmesh-markdown`；
2. 进入 **Settings** -> **Domains & Routes** -> **Add Custom Domain**；
3. 输入你的域名（例如 `tagmesh.top`），Cloudflare 将在数秒内全自动配置 SSL 证书与全球 CDN 路由！

### 步骤 7：配置 GitHub Actions CI/CD 自动交付（推荐）
在 GitHub 仓库 **Settings** -> **Secrets and variables** -> **Actions** 中添加以下密钥：
- `CLOUDFLARE_API_TOKEN`：在 Cloudflare Dashboard 创建的具备 Workers 编辑权限的 API Token
- `CLOUDFLARE_ACCOUNT_ID`：你的 Cloudflare 账户 ID
- `CLOUDFLARE_D1_DATABASE_ID`：你的 D1 Database ID

> 配置完成后，每次向 `main` 分支 `git push`，GitHub Actions 都会在 30 秒内全自动完成编译与生产发布！

---

## 🤖 MCP（Model Context Protocol）AI 客户端对接

TagMesh 原生开放了 Serverless MCP 接口，可作为 AI 助手的第二大脑：

### 1. Claude Desktop 配置
编辑 `claude_desktop_config.json`（Windows 位于 `%APPDATA%\Claude\claude_desktop_config.json`，macOS 位于 `~/Library/Application Support/Claude/claude_desktop_config.json`）：

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

### 2. Cursor / Windsurf / Cline 配置
在 IDE 的 MCP 配置文件中添加：
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

## 📦 项目技术栈 (Tech Stack)

| 领域 | 技术方案 |
| :--- | :--- |
| **前端核心** | React 19, TypeScript, Vite 6 |
| **样式与动效** | Tailwind CSS v4, Lucide Icons, Canvas 粒子引擎 |
| **富文本编辑** | TipTap Core, ProseMirror, Hashtag / Emoji / R2 截图扩展 |
| **本地持久化** | Dexie.js (IndexedDB Local-First Wrapper), dexie-react-hooks |
| **边缘服务端** | Cloudflare Workers, Hono Web Framework, Nodejs Compat |
| **云端存储** | Cloudflare D1 (SQLite + FTS5), Cloudflare R2 (Object Storage) |
| **AI 交互协议** | Model Context Protocol (MCP) JSON-RPC 2.0 |

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](./LICENSE) 开源许可证。欢迎提 Issue 与 PR，一起打造最可爱的灵感笔记网！
