const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const html=fs.readFileSync('admin.html','utf8');
const css=fs.readFileSync('admin.css','utf8');
test('le compteur de messages non lus est réservé à l’administrateur',()=>{
 assert.match(server,/url\.pathname==='\/api\/admin\/support\/unread-count'/);
 assert.match(server,/sender_role='user' AND is_read=false/);
 assert.match(server,/unreadCount:Number\(q\.rows\[0\]\?\.count\|\|0\)/);
});
test('le menu Service client affiche un badge accessible',()=>{
 assert.match(html,/id="support-unread-badge"/);
 assert.match(html,/aria-label="messages non lus"/);
 assert.match(css,/\.support-unread-badge/);
});
test('le badge est actualisé après connexion puis toutes les 30 secondes',()=>{
 assert.match(admin,/refreshSupportUnreadBadge\(\)/);
 assert.match(admin,/setInterval\(refreshSupportUnreadBadge,30000\)/);
 assert.match(admin,/\/api\/admin\/support\/unread-count/);
});
test('ouvrir la messagerie marque les messages utilisateurs comme lus',()=>{
 assert.match(server,/UPDATE support_messages SET is_read=true WHERE sender_role='user' AND is_read=false/);
 assert.match(admin,/await refreshSupportUnreadBadge\(\);host\.innerHTML=''/);
});
