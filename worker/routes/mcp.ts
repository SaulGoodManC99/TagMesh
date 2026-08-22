import { Hono } from 'hono';
import { Env } from '../env';
import { McpToolCallRequest, McpToolCallResponse } from '../../src/types/mcp';
import { searchNotesFts, getNoteById, syncNote } from '../db/queries';

export const mcpRouter = new Hono<{ Bindings: Env }>();

/**
 * Bearer Token Auth Middleware
 */
mcpRouter.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const expectedToken = c.env.MCP_AUTH_TOKEN || 'tagmesh_mcp_secret_bearer_token';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Unauthorized: Missing Bearer token' },
      },
      401
    );
  }

  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token !== expectedToken) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Unauthorized: Invalid Bearer token' },
      },
      401
    );
  }

  await next();
});

const MCP_TOOLS = [
  {
    name: 'search_by_tag',
    description: 'Search Markdown notes filtered by a specific hashtag in the TagMesh knowledge base.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'The hashtag to filter by, e.g. #cloudflare or #architecture',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of notes to return (default: 20)',
        },
      },
      required: ['tag'],
    },
  },
  {
    name: 'search_fulltext',
    description: 'Execute high-performance FTS5 full-text search across all Markdown notes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Full-text keywords to search in note bodies and tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_note',
    description: 'Retrieve the raw Markdown content, tags, and metadata of a specific note by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique Note ID (e.g. tm_...)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_or_update_note',
    description: 'Create a new Markdown note or append knowledge to TagMesh repository.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Optional existing Note ID to update',
        },
        markdown: {
          type: 'string',
          description: 'The raw Markdown content including any #hashtags',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of hashtags (e.g. ["#linear", "#docs"])',
        },
      },
      required: ['markdown'],
    },
  },
];

/**
 * POST /mcp/call
 * Edge Model Context Protocol Serverless RPC Endpoint
 */
mcpRouter.post('/call', async (c) => {
  const body = await c.req.json<McpToolCallRequest>();
  const id = body?.id ?? 1;

  if (!body || !body.method) {
    return c.json<McpToolCallResponse>(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request: Missing method' },
      },
      400
    );
  }

  // 1. Initialize
  if (body.method === 'initialize') {
    return c.json<McpToolCallResponse>({
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS,
      },
    });
  }

  // 2. Tools List
  if (body.method === 'tools/list') {
    return c.json<McpToolCallResponse>({
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS,
      },
    });
  }

  // 3. Tools Call
  if (body.method === 'tools/call') {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};
    const db = c.env.DB;

    try {
      if (toolName === 'search_by_tag') {
        const rawTag = String(args.tag || '');
        const tag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        const limit = Number(args.limit || 20);

        const results = await searchNotesFts(db, '', tag, limit);
        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tag,
                  total: results.length,
                  notes: results.map(n => ({
                    id: n.id,
                    excerpt: n.excerpt,
                    tags: n.tags,
                    wordCount: n.wordCount,
                    updatedAt: new Date(n.updatedAt).toISOString(),
                  })),
                }, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'search_fulltext') {
        const query = String(args.query || '');
        const limit = Number(args.limit || 20);

        const results = await searchNotesFts(db, query, undefined, limit);
        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  query,
                  total: results.length,
                  notes: results.map(n => ({
                    id: n.id,
                    excerpt: n.excerpt,
                    tags: n.tags,
                    preview: n.rawMarkdown.substring(0, 200),
                    updatedAt: new Date(n.updatedAt).toISOString(),
                  })),
                }, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'read_note') {
        const noteId = String(args.id || '');
        const note = await getNoteById(db, noteId);
        if (!note) {
          return c.json<McpToolCallResponse>({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [{ type: 'text', text: `Note not found with ID: ${noteId}` }],
            },
          });
        }

        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(note, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'create_or_update_note') {
        const markdown = String(args.markdown || '');
        const now = Date.now();
        const noteId = args.id ? String(args.id) : `tm_mcp_${now.toString(36)}`;
        
        // Extract excerpt & tags
        const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
        const excerpt = lines[0] ? lines[0].replace(/^[#>*`\-\d.]+\s*/, '').substring(0, 80) : 'MCP note';
        
        const extractedTags = Array.isArray(args.tags) 
          ? (args.tags as string[]) 
          : Array.from(new Set(markdown.match(/(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5-]+)/g) || [])).map(t => t.trim().toLowerCase());

        const note = {
          id: noteId,
          rawMarkdown: markdown,
          excerpt,
          tags: extractedTags,
          wordCount: markdown.split(/\s+/).length,
          charCount: markdown.length,
          version: 1,
          isPinned: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };

        const result = await syncNote(db, note, 0);
        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: true, note: result.note }, null, 2),
              },
            ],
          },
        });
      }

      return c.json<McpToolCallResponse>({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      });
    } catch (err: unknown) {
      return c.json<McpToolCallResponse>({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : 'Internal MCP error' },
      });
    }
  }

  return c.json<McpToolCallResponse>({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not supported: ${body.method}` },
  });
});
