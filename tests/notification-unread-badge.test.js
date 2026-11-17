const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('server.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('style.css','utf8');
test('le compteur de notifications non lues est calculé uniquement pour le membre connecté',()=>{
 assert.match(server,/url\.pathname==='\/api\/notifications\/unread-count'/);
 assert.match(server,/COUNT\(\*\)::int AS count FROM user_notifications WHERE user_id=\$1 AND is_read=false/);
 assert.match(server,/json\(res,200,\{unreadCount:Number\(q\.rows\[0\]\?\.count\|\|0\)\}\)/);
});
test('le compte utilisateur affiche un badge accessible et le rafraîchit après connexion et périodiquement',()=>{
 assert.match(html,/id="notice-count"/);
 assert.match(html,/aria-live="polite"/);
 assert.match(app,/refreshNotificationBadge/);
 assert.match(app,/\/api\/notifications\/unread-count/);
 assert.match(app,/setInterval\(\(\)=>\{if\(\$\('#auth-gate'\)\?\.hidden===true\)refreshNotificationBadge\(\)\},30000\)/);
 assert.match(css,/\.notice-count/);
});
test('ouvrir la boîte de notifications actualise le badge après lecture',()=>{
 assert.match(app,/modal\('Mes notifications',html\);refreshNotificationBadge\(\)/);
});
