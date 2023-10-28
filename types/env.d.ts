declare interface Env {
  SESSION_SECRET: string;
  MAGIC_LINK_SECRET: string;
  EMAIL_VERIFY_LINK_SECRET: string;
  SESSION_KV: KVNamespace;
  DB: D1Database;
  SENDGRID_API_KEY: string;
  SENTRY_DSN: string;
  FROM_EMAIL: string;
  // COUNTER: DurableObjectNamespace;
}
