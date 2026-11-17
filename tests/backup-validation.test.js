'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validateBackupDocument } = require('../scripts/validate-backup');
function sample() {
  const base = { format: 'orvia45-data-backup', version: 1, backup_type: 'data-only', generated_at: '2026-11-17T00:00:00.000Z', tables: [{ name: 'users', row_count: 1, rows: [{ id: 1 }] }] };
  return { ...base, sha256: crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex') };
}
test('valide une sauvegarde ORVIA45 intacte et calcule son résumé', () => { const result = validateBackupDocument(sample()); assert.equal(result.table_count, 1); assert.equal(result.total_rows, 1); });
test('rejette une sauvegarde dont les données ont été modifiées', () => { const doc = sample(); doc.tables[0].rows[0].id = 2; assert.throws(() => validateBackupDocument(doc), /intégrité SHA-256/); });
test('rejette les noms de table dangereux et les doublons', () => { const doc = sample(); doc.tables[0].name = 'users; DROP TABLE users'; const { sha256, ...base } = doc; doc.sha256 = crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex'); assert.throws(() => validateBackupDocument(doc), /Nom de table invalide/); });
test('rejette un nombre de lignes incohérent', () => { const doc = sample(); doc.tables[0].row_count = 2; const { sha256, ...base } = doc; doc.sha256 = crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex'); assert.throws(() => validateBackupDocument(doc), /incohérent/); });
