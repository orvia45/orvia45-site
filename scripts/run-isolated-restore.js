'use strict';
const fs = require('node:fs');
const { validateBackupDocument } = require('./validate-backup');
const { assertIsolatedTarget } = require('./prepare-restore-check');

function quoteIdent(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Identifiant SQL non autorisé : ${String(value)}`);
  return `"${value}"`;
}
function assertRestoredCounts(expectedTables, actualCounts) {
  const mismatches = [];
  for (const table of expectedTables) {
    const actual = actualCounts.get(table.name);
    if (actual !== table.row_count) mismatches.push(`${table.name}: attendu ${table.row_count}, obtenu ${actual ?? 'indisponible'}`);
  }
  if (mismatches.length) throw new Error(`Contrôle après import échoué : ${mismatches.join('; ')}.`);
  return expectedTables.reduce((sum, table) => sum + table.row_count, 0);
}

function orderTables(names, foreignKeys) {
  const set = new Set(names);
  const deps = new Map(names.map(name => [name, new Set()]));
  for (const fk of foreignKeys) {
    if (!set.has(fk.table_name) || !set.has(fk.foreign_table_name)) continue;
    if (fk.nullable) continue; // Les FK nullables seront rétablies après insertion.
    if (fk.table_name === fk.foreign_table_name) throw new Error(`Restauration interrompue : référence circulaire non nullable dans ${fk.table_name}.${fk.column_name}.`);
    deps.get(fk.table_name).add(fk.foreign_table_name);
  }
  const ordered = [];
  const pending = new Set(names);
  while (pending.size) {
    const ready = [...pending].filter(name => [...deps.get(name)].every(dep => !pending.has(dep)));
    if (!ready.length) throw new Error('Restauration interrompue : dépendances circulaires non nullables entre les tables.');
    for (const name of ready) { ordered.push(name); pending.delete(name); }
  }
  return ordered;
}

async function restore(file) {
  const { Pool } = require('pg');
  assertIsolatedTarget({ mode: process.env.ORVIA45_RESTORE_MODE, confirmation: process.env.ORVIA45_RESTORE_CONFIRM, targetUrl: process.env.RESTORE_DATABASE_URL, productionUrl: process.env.DATABASE_URL });
  const stat = fs.statSync(file);
  const maxBytes = Number(process.env.BACKUP_VALIDATE_MAX_BYTES || 250 * 1024 * 1024);
  if (!stat.isFile() || stat.size > maxBytes) throw new Error('Fichier absent, non régulier ou supérieur à la limite autorisée.');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const summary = validateBackupDocument(document);
  const backupNames = document.tables.map(table => table.name);
  const pool = new Pool({ connectionString: process.env.RESTORE_DATABASE_URL, ssl: process.env.RESTORE_PGSSL === 'true' ? { rejectUnauthorized: true } : undefined, max: 1, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  let inTransaction = false;
  try {
    const identity = await client.query('SELECT current_database() AS database_name, current_user AS database_user');
    await client.query('BEGIN'); inTransaction = true;
    await client.query("SET LOCAL statement_timeout = '180s'");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('orvia45-isolated-restore'))");

    const allTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    const existing = new Set(allTables.rows.map(row => row.table_name));
    const missing = backupNames.filter(name => !existing.has(name));
    if (missing.length) throw new Error(`Tables absentes de la base cible : ${missing.join(', ')}.`);
    const occupied = [];
    for (const name of allTables.rows.map(row => row.table_name)) {
      const result = await client.query(`SELECT EXISTS (SELECT 1 FROM public.${quoteIdent(name)} LIMIT 1) AS occupied`);
      if (result.rows[0].occupied) occupied.push(name);
    }
    if (occupied.length) throw new Error(`La base cible doit être entièrement vide. Tables contenant déjà des données : ${occupied.join(', ')}.`);

    const columnInfo = new Map();
    for (const name of backupNames) {
      const result = await client.query(`SELECT column_name,is_generated,is_identity,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [name]);
      if (!result.rowCount) throw new Error(`Impossible de lire les colonnes de ${name}.`);
      columnInfo.set(name, result.rows);
      for (const row of document.tables.find(t => t.name === name).rows) {
        const allowed = new Set(result.rows.map(c => c.column_name));
        const unknown = Object.keys(row).filter(key => !allowed.has(key));
        if (unknown.length) throw new Error(`Schéma incompatible dans ${name} : ${unknown.join(', ')}.`);
      }
    }

    const fkResult = await client.query(`SELECT tc.table_name,kcu.column_name,ccu.table_name AS foreign_table_name,kcu.ordinal_position,
      (c.is_nullable='YES') AS nullable
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema
      JOIN information_schema.columns c ON c.table_schema=tc.constraint_schema AND c.table_name=tc.table_name AND c.column_name=kcu.column_name
      WHERE tc.constraint_type='FOREIGN KEY' AND tc.constraint_schema='public' ORDER BY tc.table_name,kcu.ordinal_position`);
    const backupSet = new Set(backupNames);
    const absentRefs = fkResult.rows.filter(fk => backupSet.has(fk.table_name) && !backupSet.has(fk.foreign_table_name));
    if (absentRefs.length) throw new Error(`La sauvegarde est incomplète : tables référencées absentes (${absentRefs.map(f => `${f.table_name}.${f.column_name}`).join(', ')}).`);
    const order = orderTables(backupNames, fkResult.rows);

    const primaryKeys = new Map();
    for (const name of backupNames) {
      const pk = await client.query(`SELECT a.attname AS column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid=$1::regclass AND i.indisprimary ORDER BY array_position(i.indkey,a.attnum)`, [`public.${name}`]);
      if (!pk.rowCount) throw new Error(`Clé primaire introuvable pour ${name}; restauration annulée pour éviter les mises à jour ambiguës.`);
      primaryKeys.set(name, pk.rows.map(r => r.column_name));
    }

    const deferred = [];
    for (const name of order) {
      const meta = columnInfo.get(name);
      const generated = new Set(meta.filter(c => c.is_generated !== 'NEVER').map(c => c.column_name));
      const nullableFks = new Set(fkResult.rows.filter(fk => fk.table_name === name && fk.nullable).map(fk => fk.column_name));
      const insertColumns = meta.map(c => c.column_name).filter(c => !generated.has(c) && !nullableFks.has(c));
      const rows = document.tables.find(t => t.name === name).rows;
      for (const row of rows) {
        const cols = insertColumns.filter(c => Object.prototype.hasOwnProperty.call(row, c));
        const values = cols.map(c => row[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        const identity = meta.some(c => c.is_identity === 'ALWAYS' && cols.includes(c.column_name));
        const override = identity ? ' OVERRIDING SYSTEM VALUE' : '';
        if (cols.length) await client.query(`INSERT INTO public.${quoteIdent(name)} (${cols.map(quoteIdent).join(',')})${override} VALUES (${placeholders.join(',')})`, values);
        else await client.query(`INSERT INTO public.${quoteIdent(name)} DEFAULT VALUES`);
        if (nullableFks.size) deferred.push({ name, row, columns: [...nullableFks].filter(c => Object.prototype.hasOwnProperty.call(row, c)) });
      }
    }

    for (const item of deferred) {
      const keys = primaryKeys.get(item.name);
      const whereValues = keys.map(k => item.row[k]);
      if (whereValues.some(v => v === undefined)) throw new Error(`Clé primaire absente dans ${item.name}; mise à jour des références différées impossible.`);
      const sets = item.columns.filter(c => item.row[c] !== undefined);
      if (!sets.length) continue;
      const values = [...sets.map(c => item.row[c]), ...whereValues];
      const setSql = sets.map((c, i) => `${quoteIdent(c)}=$${i + 1}`).join(',');
      const whereSql = keys.map((k, i) => `${quoteIdent(k)}=$${sets.length + i + 1}`).join(' AND ');
      await client.query(`UPDATE public.${quoteIdent(item.name)} SET ${setSql} WHERE ${whereSql}`, values);
    }

    // Contrôle indépendant des volumes avant validation de la transaction.
    const actualCounts = new Map();
    for (const table of document.tables) {
      const count = await client.query(`SELECT COUNT(*)::text AS row_count FROM public.${quoteIdent(table.name)}`);
      actualCounts.set(table.name, Number(count.rows[0].row_count));
    }
    const verifiedRows = assertRestoredCounts(document.tables, actualCounts);
    const invalidConstraints = await client.query(`SELECT conname FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='f' AND NOT convalidated`);
    if (invalidConstraints.rowCount) throw new Error(`Contraintes de clés étrangères non validées dans la base cible : ${invalidConstraints.rows.map(r => r.conname).join(', ')}.`);

    for (const name of backupNames) {
      const meta = columnInfo.get(name);
      for (const col of meta) {
        const seq = await client.query('SELECT pg_get_serial_sequence($1,$2) AS sequence_name', [`public.${name}`, col.column_name]);
        if (!seq.rows[0].sequence_name) continue;
        const qcol = quoteIdent(col.column_name);
        await client.query(`SELECT setval($1::regclass, COALESCE((SELECT MAX(${qcol}) FROM public.${quoteIdent(name)}),1), EXISTS(SELECT 1 FROM public.${quoteIdent(name)}))`, [seq.rows[0].sequence_name]);
      }
    }
    await client.query('COMMIT'); inTransaction = false;
    process.stdout.write(`RESTAURATION DE TEST TERMINÉE — base ${identity.rows[0].database_name}, ${summary.table_count} tables, ${verifiedRows} lignes importées et contrôlées.\n`);
    process.stdout.write('La base de production n’a pas été utilisée comme cible. Vérifiez maintenant les comptes, soldes, souscriptions et relations avant tout autre usage.\n');
  } catch (error) {
    if (inTransaction) { try { await client.query('ROLLBACK'); } catch {} }
    throw error;
  } finally { client.release(); await pool.end(); }
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { process.stderr.write('Usage : npm run restore:test -- chemin/vers/sauvegarde.json\n'); process.exitCode = 2; }
  else restore(file).catch(error => { process.stderr.write(`RESTAURATION DE TEST REFUSÉE : ${error.message}\n`); process.exitCode = 1; });
}
module.exports = { quoteIdent, orderTables, assertRestoredCounts, restore };
