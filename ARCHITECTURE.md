# TagMesh Markdown: 架构设计白皮书

## 1. 架构拓扑 (Architecture Topology)

TagMesh Markdown 采用轻量、无干扰的单栏书写与边缘 Serverless 协同架构：

```
+------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                     |
|  [Single Column Focus] <---> [Tiptap Editor] <---> [Dexie.js IndexedDB Local Store]|
|           |                        |                           |                   |
|           | (Cmd+\ Sidebar)        | (Live #tag Badge & Paste) | (1.5s Debounce)   |
|           v                        v                           v                   |
+-----------+------------------------+---------------------------+-------------------+
|                                    HTTP / JSON                                     |
+------------------------------------+-----------------------------------------------+
|                                EDGE TIER (Cloudflare)                              |
|                                                                                    |
|         +-----------------------+              +-----------------------+           |
|         | Cloudflare R2 Storage |              | Cloudflare D1 Database|           |
|         | (Markdown & Images)   |              | (SQLite + FTS5 Index) |           |
|         +-----------------------+              +-----------------------+           |
|                                                                                    |
|         +-------------------------------------------------------------+            |
|         | Serverless MCP Endpoint (/mcp/call) [Claude Desktop / Cursor|            |
|         +-------------------------------------------------------------+            |
+------------------------------------------------------------------------------------+
```

---

## 2. 核心架构机制

### 2.1 彻底取消 Title 实体与层级文件夹
- 数据模型中不存在独立的 `title` 与 `folder_id`。
- 笔记是一段流式的 Markdown 正文，由其正文中随处穿插的 `#tag` 动态计算拓扑归属。
- 列表摘要与预览直接截取正文首行非空文字（`excerpt`）。

### 2.2 行内 `#tag` 实时解析与 Badge 徽章渲染
- Tiptap 通过 `DecorationSet` 实时检测正文中的 `#([a-zA-Z0-9_\u4e00-\u9fa5-]+)`。
- 将标签渲染为 `inline-hashtag-badge` 徽章，点击徽章可直接激活该标签的过滤流。
- 监听 `#` 输入，通过 `@tiptap/suggestion` 弹出浮动下拉列表进行已有标签自动补全。

### 2.3 1.5s 防抖无感同步 (Zero-Sync Hook)
- 击键优先持久化到 Dexie.js (IndexedDB)，保证 0ms 页面输入延迟。
- 1.5 秒无输入后自动触发增量推送至 `/api/notes/sync`。
- 边缘 Worker 同步写入 D1 数据库与 R2 存储桶。

### 2.4 Cloudflare D1 + FTS5 全文索引
- SQLite FTS5 虚拟表 `notes_fts` 提供亚 10 毫秒级的全文与标签检索能力。
- 自动触发器（`notes_ai`, `notes_au`, `notes_ad`）确保主表与索引表强一致性。

### 2.5 纯净 Serverless MCP 服务
- 开放 `/mcp/call` 标准 JSON-RPC 2.0 端点。
- 包含 4 大外部调用工具：`search_by_tag`、`search_fulltext`、`read_note`、`create_or_update_note`。
- 使用 Bearer Token 进行鉴权，无任何内置端内 AI 生成功能，专注纯净的知识沉淀与外部互联。
