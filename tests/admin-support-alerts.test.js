const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const admin=fs.readFileSync('admin.js','utf8');
const html=fs.readFileSync('admin.html','utf8');
const css=fs.readFileSync('admin.css','utf8');
test('les alertes sonores et écran sont activables depuis le service client',()=>{
 assert.match(html,/id="toggle-support-sound"/);assert.match(html,/id="toggle-support-desktop"/);
 assert.match(admin,/Notification\.requestPermission\(\)/);assert.match(admin,/AudioContext/);
});
test('les alertes ne se déclenchent que lorsque le nombre de messages non lus augmente',()=>{
 assert.match(admin,/smilePreviousUnreadCount!==null&&count>smilePreviousUnreadCount/);
 assert.match(admin,/document\.visibilityState==='hidden'/);
});
test('les préférences d’alerte sont conservées et le titre indique les messages non lus',()=>{
 assert.match(admin,/orviaSupportSound/);assert.match(admin,/orviaSupportDesktop/);assert.match(admin,/document\.title=count\?/);
 assert.match(css,/\.support-alert-settings/);
});
