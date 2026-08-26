# 🤖 Model Context Protocol (MCP) 集成指南

TagMesh 原生内置 Serverless JSON-RPC 2.0 / Streamable HTTP 协议网关（挂载于 `/mcp` 与 `/mcp/call`），允许 **Claude Desktop**、**Cursor**、**Windsurf**、**Cline / Roo Code** 以及各类自定义 **AI Agent** 随时读写与检索您的笔记知识网。

---

## ⚡ 核心服务信息

- **MCP 端点地址**：`https://<YOUR_TAGMESH_DOMAIN>/mcp`（本地开发：`http://localhost:8787/mcp`）
- **通信协议**：`JSON-RPC 2.0`
- **身份认证**：`Authorization: Bearer <MCP_AUTH_TOKEN>`（默认：`tagmesh_mcp_secret_bearer_token`）
- **一键配置面板**：登录 TagMesh 馆长后台，进入 **「🤖 AI / MCP 网关」** 选项卡即可一键复制各客户端配置或测试网络连通性。

---

## 🛠️ 支持的 9 大核心 MCP 工具

| 工具名称 | 说明 | 核心参数 |
| :--- | :--- | :--- |
| **`list_notes`** | 分页查询近期笔记，支持标签过滤与公开/私密筛选 | `limit` (默认20), `offset`, `tag`, `publicOnly` (布尔值) |
| **`search_by_tag`** | 按指定 `#tag` 精准过滤笔记 | `tag` (如 `#architecture`), `limit` |
| **`search_fulltext`** | 利用 Cloudflare D1 SQLite FTS5 全文索引毫秒级多关键词检索 | `query` (关键词), `limit` |
| **`read_note`** | 按 Note ID 读取笔记完整 Markdown 正文、标签与元数据 | `id` (例如 `tm_...`) |
| **`create_or_update_note`** | 由 AI 创建新笔记或覆盖现有笔记，支持指定公开/私密 | `markdown`, `tags` (数组), `isPublic` (布尔值), `id` (可选) |
| **`append_to_note`** | 向指定现有笔记无缝追加段落或新标签 | `id`, `contentToAppend`, `additionalTags` (可选) |
| **`list_tags`** | 获取知识库内所有唯一标签及其笔记计数统计 | 无 |
| **`delete_note`** | 将指定笔记移入回收站 | `id` |
| **`get_workspace_stats`** | 获取笔记总数、字数、活跃标签与运行指标 | 无 |

---

## 💻 常见 AI 客户端一键配置

### 1. Claude Desktop (`claude_desktop_config.json`)

在 macOS 路径 `~/Library/Application Support/Claude/claude_desktop_config.json` 或 Windows 路径 `%APPDATA%\Claude\claude_desktop_config.json` 中配置：

```json
{
  "mcpServers": {
    "tagmesh": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<YOUR_TAGMESH_DOMAIN>/mcp",
        "--header",
        "Authorization: Bearer tagmesh_mcp_secret_bearer_token"
      ]
    }
  }
}
```

---

### 2. Cursor (`.cursor/mcp.json` / Features Settings)

在 Cursor 设置中打开 **Features -> MCP Servers**，或者在项目根目录下创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "tagmesh": {
      "url": "https://<YOUR_TAGMESH_DOMAIN>/mcp",
      "headers": {
        "Authorization": "Bearer tagmesh_mcp_secret_bearer_token"
      }
    }
  }
}
```

---

### 3. Windsurf (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "tagmesh": {
      "serverUrl": "https://<YOUR_TAGMESH_DOMAIN>/mcp",
      "headers": {
        "Authorization": "Bearer tagmesh_mcp_secret_bearer_token"
      }
    }
  }
}
```

---

### 4. Cline / Roo Code (`cline_mcp_settings.json`)

```json
{
  "mcpServers": {
    "tagmesh": {
      "url": "https://<YOUR_TAGMESH_DOMAIN>/mcp",
      "headers": {
        "Authorization": "Bearer tagmesh_mcp_secret_bearer_token"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

### 5. cURL 命令行直接调用测试

```bash
# 1. 查询工具列表
curl -X POST "https://<YOUR_TAGMESH_DOMAIN>/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tagmesh_mcp_secret_bearer_token" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 2. 列出最新笔记
curl -X POST "https://<YOUR_TAGMESH_DOMAIN>/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tagmesh_mcp_secret_bearer_token" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_notes","arguments":{"limit":5}}}'
```
