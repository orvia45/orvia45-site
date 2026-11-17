'use strict';
const crypto = require('node:crypto');
const { Pool } = require('pg');
const { createS3Request } = require('../backup-s3-lib');

async function main() {
  const required = ['DATABASE_URL', 'S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  const region = process.env.S3_REGION || 'us-east-1';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined, max: 1, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '240s'");
    const listed = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const excluded = new Set(['sessions', 'special_control_sessions', 'trusted_admin_devices']);
    const tables = [];
    for (const item of listed.rows) {
      if (excluded.has(item.tablename)) continue;
      const table = item.tablename.replace(/"/g, '""');
      const result = await client.query(`SELECT * FROM public."${table}"`);
      tables.push({ name: item.tablename, row_count: result.rowCount, rows: result.rows });
    }
    await client.query('COMMIT');
    const generatedAt = new Date().toISOString();
    const base = { format: 'orvia45-data-backup', version: 1, backup_type: 'data-only', generated_at: generatedAt, generated_by: 'scheduled-render-cron', database: 'PostgreSQL public schema', excluded_tables: [...excluded], restore_note: 'Export logique de données uniquement. Le schéma SQL et les fichiers téléversés ne sont pas inclus. Tester toute restauration sur une base séparée.', tables };
    const content = JSON.stringify({ ...base, sha256: crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex') });
    const body = Buffer.from(content);
    const maxBytes = Number(process.env.BACKUP_MAX_BYTES || 250 * 1024 * 1024);
    if (body.length > maxBytes) throw new Error(`Sauvegarde trop volumineuse (${body.length} octets ; limite ${maxBytes}).`);
    const stamp = generatedAt.replace(/[:.]/g, '-');
    const prefix = String(process.env.S3_PREFIX || 'orvia45/backups').replace(/^\/+|\/+$/g, '');
    const key = `${prefix}/orvia45-data-${stamp}.json`;
    const request = createS3Request({ endpoint: process.env.S3_ENDPOINT, bucket: process.env.S3_BUCKET, key, region, accessKey: process.env.S3_ACCESS_KEY_ID, secretKey: process.env.S3_SECRET_ACCESS_KEY, body });
    const response = await fetch(request.url, { method: 'PUT', headers: request.headers, body, signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Le stockage S3 a refusé la sauvegarde (HTTP ${response.status}).`);
    process.stdout.write(`Sauvegarde ORVIA45 envoyée : s3://${process.env.S3_BUCKET}/${key} (${body.length} octets)\n`);
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(error => { console.error(`ÉCHEC SAUVEGARDE ORVIA45 : ${error.message}`); process.exitCode = 1; });
