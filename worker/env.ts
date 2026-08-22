export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  MCP_AUTH_TOKEN?: string;
  R2_PUBLIC_BASE_URL?: string;
  ENVIRONMENT?: string;
}
