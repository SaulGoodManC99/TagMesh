# Model Context Protocol (MCP) 集成指南

TagMesh Markdown 内置纯净的 Serverless MCP 接口 (`/mcp/call`)，允许 **Claude Desktop** 或 **Cursor** 随时调取与记录您的知识卡片。

---

## 1. Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "tagmesh-markdown": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "--url",
        "https://your-domain.workers.dev/mcp/call",
        "--header",
        "Authorization: Bearer tagmesh_mcp_secret_bearer_token"
      ]
    }
  }
}
```

---

## 2. Cursor 配置

在 Cursor 设置中打开 **Features -> MCP Servers**，添加新服务：
- **Name**: `TagMesh Markdown`
- **URL**: `https://your-domain.workers.dev/mcp/call`
- **Headers**:
  - `Authorization`: `Bearer tagmesh_mcp_secret_bearer_token`

---

## 3. 支持的纯净 MCP 工具

- **`search_by_tag`**：按特定 `#tag` 精准过滤笔记。
- **`search_fulltext`**：利用 D1 FTS5 全文索引毫秒级检索笔记。
- **`read_note`**：按 ID 读取笔记完整 Markdown 正文与关联标签。
- **`create_or_update_note`**：由外部 AI 助手创建新笔记或追加记录。
