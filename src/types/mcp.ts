export interface McpToolCallRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'tools/call' | 'tools/list' | 'initialize';
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface McpToolCallResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content?: Array<{
      type: 'text' | 'image' | 'resource';
      text?: string;
      data?: string;
      mimeType?: string;
    }>;
    tools?: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
