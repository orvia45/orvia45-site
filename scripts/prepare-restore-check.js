'use strict';
const fs = require('node:fs');
const { URL } = require('node:url');
const { validateBackupDocument } = require('./validate-backup');

function databaseIdentity(value) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname.toLowerCase()}:${url.port || '5432'}${url.pathname}`;
}
function assertIsolatedTarget({ mode, confirmation, targetUrl, productionUrl }) {
  if (mode !== 'isolated-test') throw new Error('Refus : ORVIA45_RESTORE_MODE doit être exactement « isolated-test ».');
  if (confirmation !== 'I_UNDERSTAND_THIS_IS_TEST_ONLY') throw new Error('Refus : confirmation explicite de la base de test manquante.');
  if (!targetUrl || !productionUrl) throw new Error('RESTORE_DATABASE_URL et DATABASE_URL sont obligatoires.');
  if (databaseIdentity(targetUrl) === databaseIdentity(productionUrl)) throw new Error('Refus : la cible correspond à la base de production.');
}
async function prepare(file) {
  const { Pool } = require('pg');
  assertIsolatedTarget({ mode: process.env.ORVIA45_RESTORE_MODE, confirmation: process.env.ORVIA45_RESTORE_CONFIRM, targetUrl: process.env.RESTORE_DATABASE_URL, productionUrl: process.env.DATABASE_URL });
  const stat = fs.statSync(file);
  const maxBytes = Number(process.env.BACKUP_VALIDATE_MAX_BYTES || 250 * 1024 * 1024);
  if (!stat.isFile() || stat.size > maxBytes) throw new Error('Fichier absent, non régulier ou supérieur à la limite autorisée.');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const summary = validateBackupDocument(document);
  const pool = new Pool({ connectionString: process.env.RESTORE_DATABASE_URL, ssl: process.env.RESTORE_PGSSL === 'true' ? { rejectUnauthorized: true } : undefined, max: 1, connectionTimeoutMillis: 10000 });
  try {
    const identity = await pool.query('SELECT current_database() AS database_name, current_user AS database_user');
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    const available = new Set(tables.rows.map(row => row.table_name));
    const missing = document.tables.map(table => table.name).filter(name => !available.has(name));
    if (missing.length) throw new Error(`Tables absentes de la base de test : ${missing.join(', ')}.`);
    const nonEmpty = [];
    const incompatible = [];
    for (const table of document.tables) {
      const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1", [table.name]);
      const allowed = new Set(columns.rows.map(row => row.column_name));
      for (const row of table.rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) { incompatible.push(`${table.name}: ligne non objet`); break; }
        const unknown = Object.keys(row).filter(key => !allowed.has(key));
        if (unknown.length) { incompatible.push(`${table.name}: colonnes inconnues (${unknown.join(', ')})`); break; }
      }
      const count = await pool.query(`SELECT EXISTS (SELECT 1 FROM public."${table.name.replace(/"/g, '""')}" LIMIT 1) AS has_rows`);
      if (count.rows[0].has_rows) nonEmpty.push(table.name);
    }
    if (incompatible.length) throw new Error(`Schéma incompatible : ${incompatible.join('; ')}.`);
    if (nonEmpty.length) throw new Error(`La base de test n'est pas vide : ${nonEmpty.join(', ')}. Utilisez une base de test neuve.`);
    process.stdout.write(`PRÉ-VÉRIFICATION OK — cible ${identity.rows[0].database_name} (utilisateur ${identity.rows[0].database_user}), ${summary.table_count} tables, ${summary.total_rows} lignes.\n`);
    process.stdout.write('AUCUNE DONNÉE IMPORTÉE : ce contrôle vérifie uniquement l’isolement, le schéma et l’état vide de la cible.\n');
  } finally { await pool.end(); }
}
if (require.main === module) {
  const file = process.argv[2];
  if (!file) { process.stderr.write('Usage : npm run restore:prepare-test -- chemin/vers/sauvegarde.json\n'); process.exitCode = 2; }
  else prepare(file).catch(error => { process.stderr.write(`PRÉ-VÉRIFICATION REFUSÉE : ${error.message}\n`); process.exitCode = 1; });
}
module.exports = { databaseIdentity, assertIsolatedTarget };
