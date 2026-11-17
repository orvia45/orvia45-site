const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('les rubriques utilisateur reçoivent un bouton retour contextuel', () => {
  assert.match(app, /function ensureUserBackButtons\(/);
  assert.match(app, /className='smart-page-back'/);
  assert.match(app, /function goBack\(/);
  assert.match(app, /history\.back\(\)/);
});

test('les rubriques d’administration disposent aussi d’un retour vers la section précédente', () => {
  assert.match(admin, /function ensureAdminBackButtons\(/);
  assert.match(admin, /className='outline admin-smart-back'/);
  assert.match(admin, /smileAdminSectionStack/);
});

test('les boutons retour ont un style responsive et interactif', () => {
  assert.match(css, /\.smart-back-button/);
});
