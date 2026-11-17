const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('WhatsApp n’ouvre pas un lien de discussion vide et Google pointe vers son site officiel', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'support-links.js'), 'utf8');
  assert.equal((html.match(/data-whatsapp-link/g) || []).length, 2);
  assert.match(html, /https:\/\/www\.google\.com\//);
  assert.doesNotMatch(html, /https:\/\/wa\.me\//);
  assert.match(js, /SMILE_WHATSAPP_NUMBER = ''/);
  assert.match(js, /numéro WhatsApp officiel de SMILE n’est pas encore configuré/);
  assert.match(js, /https:\/\/wa\.me\/\$\{digits\}/);
});
