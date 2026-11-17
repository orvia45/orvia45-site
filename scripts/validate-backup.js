'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');

function validateBackupDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('Le fichier doit contenir un objet JSON.');
  if (document.format !== 'orvia45-data-backup' || document.version !== 1 || document.backup_type !== 'data-only') throw new Error('Format de sauvegarde ORVIA45 non reconnu.');
  if (!Array.isArray(document.tables) || document.tables.length === 0) throw new Error('La sauvegarde ne contient aucune table.');
  if (typeof document.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(document.sha256)) throw new Error('Empreinte SHA-256 absente ou invalide.');
  const { sha256, ...base } = document;
  const actual = crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex');
  const expectedBuffer = Buffer.from(sha256, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) throw new Error('Échec du contrôle d’intégrité SHA-256 : le fichier a été modifié ou est corrompu.');
  const names = new Set();
  let totalRows = 0;
  for (const table of document.tables) {
    if (!table || typeof table.name !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table.name)) throw new Error('Nom de table invalide dans la sauvegarde.');
    if (names.has(table.name)) throw new Error(`Table présente plusieurs fois : ${table.name}.`);
    names.add(table.name);
    if (!Array.isArray(table.rows) || !Number.isSafeInteger(table.row_count) || table.row_count < 0 || table.row_count !== table.rows.length) throw new Error(`Nombre de lignes incohérent pour la table ${table.name}.`);
    totalRows += table.row_count;
  }
  return { generated_at: document.generated_at || null, table_count: document.tables.length, total_rows: totalRows, sha256: actual, backup_type: document.backup_type };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { process.stderr.write('Usage : npm run backup:validate -- chemin/vers/sauvegarde.json\n'); process.exitCode = 2; }
  else {
    try {
      const stat = fs.statSync(file);
      const maxBytes = Number(process.env.BACKUP_VALIDATE_MAX_BYTES || 250 * 1024 * 1024);
      if (!stat.isFile() || stat.size > maxBytes) throw new Error('Fichier absent, non régulier ou supérieur à la limite autorisée.');
      const document = JSON.parse(fs.readFileSync(file, 'utf8'));
      const result = validateBackupDocument(document);
      process.stdout.write(`Sauvegarde ORVIA45 valide : ${result.table_count} tables, ${result.total_rows} lignes, SHA-256 ${result.sha256}.\n`);
      process.stdout.write('Contrôle uniquement : aucune donnée n’a été restaurée ou modifiée.\n');
    } catch (error) { process.stderr.write(`SAUVEGARDE NON VALIDÉE : ${error.message}\n`); process.exitCode = 1; }
  }
}
module.exports = { validateBackupDocument };
