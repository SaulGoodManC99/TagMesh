export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
  ASSETS?: Fetcher;
  MCP_AUTH_TOKEN?: string;
  ADMIN_PASSWORD?: string;
  API_AUTH_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ALLOWED_USER_IDS?: string;
  R2_PUBLIC_BASE_URL?: string;
  ENVIRONMENT?: string;
}
