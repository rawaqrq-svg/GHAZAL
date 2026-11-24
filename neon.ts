import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * GHAZAL - Independent Neon PostgreSQL Disaster Recovery Configuration & Driver
 *
 * ARCHITECTURAL RULE:
 * This client connects strictly to the independent Neon Disaster Recovery database.
 * Supabase remains the primary database for day-to-day operations, POS cashier, and Prisma.
 * Daily storefront and cashier transactions MUST NEVER be routed through this file.
 */

export interface BackupLogEntry {
  id: string;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  status: 'SUCCESS' | 'FAILED' | 'VERIFICATION_FAILED' | 'IN_PROGRESS';
  sourceDb?: string;
  targetDb?: string;
  durationSeconds?: number | null;
  dumpSizeBytes?: number | null;
  tableCount?: number | null;
  rowCount?: number | null;
  financialSumFils?: number | null;
  verificationDetails?: Record<string, any> | null;
  errorMessage?: string | null;
  emailSent?: boolean;
  emailId?: string | null;
  createdAt?: Date | string;
}

export interface NeonConnectionTestResult {
  ok: boolean;
  latencyMs: number;
  version?: string;
  database?: string;
  currentUser?: string;
  error?: string;
}

/**
 * Resolves the Neon Backup connection string.
 */
export function getNeonBackupUrl(): string {
  const url = process.env.NEON_BACKUP_URL;
  if (!url) {
    throw new Error(
      'NEON_BACKUP_URL environment variable is not defined. Please configure it in your environment or .env file.'
    );
  }
  return url;
}

/**
 * Derives an unpooled direct connection URL from a pooled Neon URL if applicable.
 * Neon PgBouncer pooler URLs contain '-pooler'. For DDL-heavy operations like pg_restore,
 * a direct unpooled connection is preferred.
 */
export function getDirectNeonBackupUrl(url: string = getNeonBackupUrl()): string {
  return url.replace('-pooler.', '.');
}

// Global pool caching in development to avoid socket leaks on Next.js hot reload
declare global {
  var __neonPool: Pool | undefined;
}

let neonPoolInstance: Pool | null = null;

/**
 * Creates or retrieves the singleton pg.Pool for Neon DR operations.
 */
export function getNeonPool(): Pool {
  if (process.env.NODE_ENV !== 'production' && global.__neonPool) {
    return global.__neonPool;
  }

  if (neonPoolInstance) {
    return neonPoolInstance;
  }

  const connectionString = getNeonBackupUrl();

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  pool.on('error', (err) => {
    console.error('[Neon Disaster Recovery Pool Error]:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__neonPool = pool;
  } else {
    neonPoolInstance = pool;
  }

  return pool;
}

/**
 * Executes a query on Neon with automatic retry and exponential backoff.
 * Neon serverless instances sleep after 5 minutes of idle time. Cold-start wakeups
 * take 500ms to 3s. This helper guarantees graceful waking without failing client requests.
 */
export async function queryNeonWithRetry<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
  maxRetries: number = 3
): Promise<QueryResult<T>> {
  const pool = getNeonPool();
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err.code === 'ECONNRESET' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === '57P01' || // admin_shutdown / server closing
        err.message?.includes('Connection terminated') ||
        err.message?.includes('timeout') ||
        err.message?.includes('socket');

      if (!isTransient || attempt === maxRetries) {
        throw err;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      console.warn(
        `[Neon Retry] Transient connection warning on attempt ${attempt}/${maxRetries}. Backing off for ${backoffMs}ms... Reason: ${err.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

/**
 * Initializes the independent `_backup_audit_log` table on Neon.
 * This table is decoupled from Supabase so administrative inspection and audit history
 * remain 100% accessible even during a catastrophic Supabase outage.
 */
export async function ensureBackupAuditLogTable(): Promise<void> {
  const ddl = `
    CREATE SCHEMA IF NOT EXISTS public;

    CREATE TABLE IF NOT EXISTS public._backup_audit_log (
      id VARCHAR(64) PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      status VARCHAR(30) NOT NULL,
      source_db VARCHAR(100) DEFAULT 'Supabase PostgreSQL',
      target_db VARCHAR(100) DEFAULT 'Neon PostgreSQL (ghazal_backup_current)',
      duration_seconds INT,
      dump_size_bytes BIGINT,
      table_count INT,
      row_count BIGINT,
      financial_sum_fils BIGINT,
      verification_details JSONB,
      error_message TEXT,
      email_sent BOOLEAN DEFAULT false,
      email_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_backup_audit_log_started_at 
    ON public._backup_audit_log(started_at DESC);
  `;

  await queryNeonWithRetry(ddl);
}

/**
 * Writes or updates an entry in the Neon `_backup_audit_log` table.
 */
export async function writeBackupAuditLog(entry: BackupLogEntry): Promise<void> {
  await ensureBackupAuditLogTable();

  const query = `
    INSERT INTO public._backup_audit_log (
      id,
      started_at,
      completed_at,
      status,
      source_db,
      target_db,
      duration_seconds,
      dump_size_bytes,
      table_count,
      row_count,
      financial_sum_fils,
      verification_details,
      error_message,
      email_sent,
      email_id,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    ON CONFLICT (id) DO UPDATE SET
      completed_at = EXCLUDED.completed_at,
      status = EXCLUDED.status,
      duration_seconds = EXCLUDED.duration_seconds,
      dump_size_bytes = EXCLUDED.dump_size_bytes,
      table_count = EXCLUDED.table_count,
      row_count = EXCLUDED.row_count,
      financial_sum_fils = EXCLUDED.financial_sum_fils,
      verification_details = EXCLUDED.verification_details,
      error_message = EXCLUDED.error_message,
      email_sent = EXCLUDED.email_sent,
      email_id = EXCLUDED.email_id;
  `;

  const values = [
    entry.id,
    new Date(entry.startedAt),
    entry.completedAt ? new Date(entry.completedAt) : null,
    entry.status,
    entry.sourceDb || 'Supabase PostgreSQL',
    entry.targetDb || 'Neon PostgreSQL (ghazal_backup_current)',
    entry.durationSeconds ?? null,
    entry.dumpSizeBytes ?? null,
    entry.tableCount ?? null,
    entry.rowCount ?? null,
    entry.financialSumFils ?? null,
    entry.verificationDetails ? JSON.stringify(entry.verificationDetails) : null,
    entry.errorMessage ?? null,
    entry.emailSent ?? false,
    entry.emailId ?? null,
  ];

  await queryNeonWithRetry(query, values);
}

/**
 * Fetches recent backup audit logs from Neon.
 */
export async function getBackupAuditLogs(limit: number = 20): Promise<BackupLogEntry[]> {
  try {
    await ensureBackupAuditLogTable();

    const query = `
      SELECT 
        id,
        started_at as "startedAt",
        completed_at as "completedAt",
        status,
        source_db as "sourceDb",
        target_db as "targetDb",
        duration_seconds as "durationSeconds",
        dump_size_bytes as "dumpSizeBytes",
        table_count as "tableCount",
        row_count as "rowCount",
        financial_sum_fils as "financialSumFils",
        verification_details as "verificationDetails",
        error_message as "errorMessage",
        email_sent as "emailSent",
        email_id as "emailId",
        created_at as "createdAt"
      FROM public._backup_audit_log
      ORDER BY started_at DESC
      LIMIT $1;
    `;

    const result = await queryNeonWithRetry<BackupLogEntry>(query, [limit]);
    return result.rows;
  } catch (err: any) {
    console.error('[Neon Backup Audit Log Query Failed]:', err.message);
    return [];
  }
}

/**
 * Fetches the latest successfully verified backup record from Neon.
 */
export async function getLatestSuccessfulBackup(): Promise<BackupLogEntry | null> {
  try {
    await ensureBackupAuditLogTable();

    const query = `
      SELECT 
        id,
        started_at as "startedAt",
        completed_at as "completedAt",
        status,
        source_db as "sourceDb",
        target_db as "targetDb",
        duration_seconds as "durationSeconds",
        dump_size_bytes as "dumpSizeBytes",
        table_count as "tableCount",
        row_count as "rowCount",
        financial_sum_fils as "financialSumFils",
        verification_details as "verificationDetails",
        error_message as "errorMessage",
        email_sent as "emailSent",
        email_id as "emailId",
        created_at as "createdAt"
      FROM public._backup_audit_log
      WHERE status = 'SUCCESS'
      ORDER BY started_at DESC
      LIMIT 1;
    `;

    const result = await queryNeonWithRetry<BackupLogEntry>(query, []);
    return result.rows[0] || null;
  } catch (err: any) {
    console.error('[Neon Latest Backup Query Failed]:', err.message);
    return null;
  }
}

/**
 * Live test of Neon database connectivity and latency.
 */
export async function testNeonConnection(): Promise<NeonConnectionTestResult> {
  const start = Date.now();
  try {
    const res = await queryNeonWithRetry(
      'SELECT version(), current_database(), current_user;'
    );
    const latencyMs = Date.now() - start;
    const row = res.rows[0];

    return {
      ok: true,
      latencyMs,
      version: row?.version,
      database: row?.current_database,
      currentUser: row?.current_user,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Failed to connect to Neon PostgreSQL',
    };
  }
}
