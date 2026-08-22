# TagMesh Markdown 🚀

> **彻底摒弃“标题”与“文件夹”、全键盘驱动、仅依靠正文随处穿插的 `#标签` 组织的高性能 Markdown 笔记系统**  
> 纯粹书写体验 + 纯净 Serverless MCP 知识检索接口。

---

## 🌟 核心设计理念 (Architecture Philosophy)

1. **无标题 & 无文件夹设计 (Zero Titles & Folders)**：
   - 彻底取消独立的 Title 实体与层级目录树。笔记即纯粹的 Markdown 文本流。
   - 分类全靠正文中任意位置键入的 `#标签`（如 `#cloudflare`、`#架构`、`#todo`）。
   - 列表展示自动截取首行非空文字作为预览摘要。
2. **行内 HashTag 实时 Badge 渲染与自动补全**：
   - Tiptap 实时将 `#tag` 渲染为精致的 Badge 徽章，点击徽章即可直接过滤该标签下的所有笔记。
   - 键入 `#` 字符自动唤起已有标签的智能补全下拉列表。
3. **纯标签聚合侧边栏 (Tag Mesh Slide-over)**：
   - 按 `Cmd + \` 呼出侧边栏，按实时频次聚合全库所有标签（如 `#all (42)`、`#untagged (3)`、`#cloudflare (12)`）。
4. **全局命令中枢 (Cmd + K)**：
   - 基于 `cmdk` 打造，支持全文 FTS5 搜索、按 `#` 搜标签，输入文字直接回车创建新笔记。
5. **剪贴板直传 Cloudflare R2**：
   - 截图直接 `Ctrl+V` / `Cmd+V` 粘贴，静默上传至 Cloudflare R2 对象存储（0 出站流量费），即时渲染为 Markdown 语法。
6. **纯净 Serverless MCP 接口（无端内 AI）**：
   - 边缘端提供 `/mcp/call` 接口及 Bearer 认证，供外部 Claude Desktop 或 Cursor 调用（`search_by_tag`, `search_fulltext`, `read_note`, `create_or_update_note`）。
   - 无任何端内 AI 生成或冗余提词功能，回归极致纯粹。

---

## ⚡ 全键盘极速快捷键 (Keyboard-First)

| 快捷键 | 作用 | 场景 |
| :--- | :--- | :--- |
| **`Cmd + K` / `Ctrl + K`** | 唤起全局命令中枢 (全文搜索 / 输入直接回车建笔记) | 全局 |
| **`Cmd + \` / `Ctrl + \`** | 展开/收起左侧纯标签聚合侧边栏 | 全局 |
| **`Cmd + N` / `Ctrl + N`** | 极速新建空白笔记 | 全局 |
| **`Cmd + S` / `Ctrl + S`** | 强制触发立即同步 | 全局 |
| **`#`** | 唤起已有标签智能补全建议 | 编辑器内 |
| **`Cmd + Shift + L`** | 一键切换中英文双语界面 (EN / 中文) | 全局 |
| **`Cmd + /` / `Ctrl + /`** | 打开快捷键说明面板 | 全局 |
| **`Esc`** | 关闭当前弹窗 / 侧边栏 | 全局 |

---

## 🛠️ 全栈技术架构

- **前端**：React 19 + Tailwind CSS v4 + Dexie.js (IndexedDB 离线优先) + Tiptap v2 + `cmdk` + Lucide 图标。
- **后端**：Cloudflare Workers + Hono.js。
- **数据库**：Cloudflare D1 (SQLite + FTS5 全文索引虚拟表)。
- **存储**：Cloudflare R2 (Markdown 源文件与图片存储，0 出站流量费)。
- **协议**：Serverless Model Context Protocol (MCP) JSON-RPC 2.0。

---

## 🚀 启动与开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 编译生产版本
npm run build

# 初始化本地 D1 SQLite 数据库与 FTS5 虚拟表
npm run db:init

# 部署至 Cloudflare Workers
npm run worker:deploy
```
