import { Hono, Context } from 'hono';
import { Env } from '../env';
import { McpToolCallRequest, McpToolCallResponse } from '../../src/types/mcp';
import { searchNotesFts, getNoteById, syncNote, listNotes } from '../db/queries';

export const mcpRouter = new Hono<{ Bindings: Env }>();

/**
 * Bearer Token Auth Middleware (Applies to POST / RPC calls, allows GET / OPTIONS for service discovery)
 */
mcpRouter.use('*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'OPTIONS') {
    return await next();
  }

  const authHeader = c.req.header('Authorization');
  const expectedToken = c.env.MCP_AUTH_TOKEN || 'tagmesh_mcp_secret_bearer_token';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Unauthorized: Missing Bearer token in Authorization header' },
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
    name: 'list_notes',
    description: 'List recent notes from TagMesh repository with pagination, tag filtering, and visibility metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of notes to return (default: 20, max: 100)',
        },
        offset: {
          type: 'number',
          description: 'Number of notes to skip for pagination (default: 0)',
        },
        tag: {
          type: 'string',
          description: 'Optional hashtag to filter by, e.g. #architecture',
        },
        publicOnly: {
          type: 'boolean',
          description: 'If true, only return public notes; if false or omitted, return all notes.',
        },
      },
    },
  },
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
    description: 'Retrieve the raw Markdown content, tags, visibility status, and metadata of a specific note by ID.',
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
    description: 'Create a new Markdown note or overwrite a note in TagMesh repository with optional visibility.',
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
          description: 'Array of hashtags (e.g. ["#ideas", "#ai"])',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the note is public in the gallery (true) or private/curator-only (false). Defaults to true.',
        },
      },
      required: ['markdown'],
    },
  },
  {
    name: 'append_to_note',
    description: 'Append content, paragraphs, or extra tags to an existing Markdown note seamlessly.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Target Note ID to append to',
        },
        contentToAppend: {
          type: 'string',
          description: 'New Markdown content or bullet points to append',
        },
        additionalTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional additional hashtags to attach',
        },
      },
      required: ['id', 'contentToAppend'],
    },
  },
  {
    name: 'list_tags',
    description: 'Retrieve all unique tags across the knowledge base with their note counts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'delete_note',
    description: 'Soft-delete or move a note into the recycle bin.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Target Note ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_workspace_stats',
    description: 'Get total notes, word counts, active tags, and repository health metrics.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Handle MCP RPC Calls
 */
async function handleMcpRpc(c: Context<{ Bindings: Env }>) {
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
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'tagmesh-markdown-mcp',
          version: '1.0.0',
        },
        capabilities: {
          tools: {},
        },
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
      if (toolName === 'list_notes') {
        const limit = Math.min(Number(args.limit || 20), 100);
        const offset = Math.max(Number(args.offset || 0), 0);
        const publicOnly = Boolean(args.publicOnly);
        const tag = args.tag ? String(args.tag).trim() : '';

        let notes = tag 
          ? await searchNotesFts(db, '', tag, limit)
          : await listNotes(db, limit, offset, publicOnly);

        if (publicOnly && tag) {
          notes = notes.filter(n => n.isPublic !== false);
        }

        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  total: notes.length,
                  limit,
                  offset,
                  publicOnly,
                  tag: tag || undefined,
                  notes: notes.map(n => ({
                    id: n.id,
                    excerpt: n.excerpt,
                    tags: n.tags,
                    isPublic: n.isPublic !== false,
                    isPinned: Boolean(n.isPinned),
                    wordCount: n.wordCount,
                    createdAt: new Date(n.createdAt).toISOString(),
                    updatedAt: new Date(n.updatedAt).toISOString(),
                  })),
                }, null, 2),
              },
            ],
          },
        });
      }

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
                    isPublic: n.isPublic !== false,
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
                    isPublic: n.isPublic !== false,
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
        const isPublic = args.isPublic !== undefined ? Boolean(args.isPublic) : true;
        
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
          isPublic,
          createdAt: now,
          updatedAt: now,
          author: 'admin' as const,
          isOfficial: true,
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

      if (toolName === 'append_to_note') {
        const noteId = String(args.id || '');
        const contentToAppend = String(args.contentToAppend || '');
        const existing = await getNoteById(db, noteId);
        if (!existing) {
          return c.json<McpToolCallResponse>({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [{ type: 'text', text: `Target note ${noteId} not found` }],
            },
          });
        }

        const now = Date.now();
        const mergedMarkdown = `${existing.rawMarkdown.trim()}\n\n${contentToAppend.trim()}`;
        const newTags = Array.isArray(args.additionalTags) ? args.additionalTags : [];
        const mergedTags = Array.from(new Set([...existing.tags, ...newTags]));

        const updatedNote = {
          ...existing,
          rawMarkdown: mergedMarkdown,
          tags: mergedTags,
          wordCount: mergedMarkdown.split(/\s+/).length,
          charCount: mergedMarkdown.length,
          updatedAt: now,
        };

        const result = await syncNote(db, updatedNote, existing.version);
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

      if (toolName === 'delete_note') {
        const noteId = String(args.id || '');
        const now = Date.now();
        await db
          .prepare('UPDATE notes SET is_deleted = 1, updated_at = ?, synced_at = ? WHERE id = ?')
          .bind(now, now, noteId)
          .run();

        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: true, deletedId: noteId }),
              },
            ],
          },
        });
      }

      if (toolName === 'list_tags') {
        const { results } = await db
          .prepare('SELECT tags_json FROM notes WHERE is_deleted = 0')
          .all<{ tags_json: string }>();

        const counts: Record<string, number> = {};
        for (const row of results || []) {
          try {
            const tags = JSON.parse(row.tags_json || '[]');
            for (const t of tags) {
              if (t) counts[t] = (counts[t] || 0) + 1;
            }
          } catch {
            // ignore
          }
        }

        const tagList = Object.entries(counts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);

        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ totalTags: tagList.length, tags: tagList }, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'get_workspace_stats') {
        const countRow = await db
          .prepare('SELECT COUNT(*) as totalNotes, SUM(word_count) as totalWords FROM notes WHERE is_deleted = 0')
          .first<{ totalNotes: number; totalWords: number }>();

        return c.json<McpToolCallResponse>({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalNotes: countRow?.totalNotes || 0,
                  totalWords: countRow?.totalWords || 0,
                  service: 'TagMesh Markdown Edge MCP',
                  timestamp: Date.now(),
                }, null, 2),
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
}

mcpRouter.post('/call', handleMcpRpc);
mcpRouter.post('/', handleMcpRpc);

mcpRouter.get('/', (c) => {
  return c.json({
    service: 'TagMesh Model Context Protocol (MCP) Serverless Endpoint',
    version: '1.0.0',
    protocol: 'JSON-RPC 2.0',
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS.map(t => ({ name: t.name, description: t.description })),
  });
});
