'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createS3Request, sha256 } = require('../backup-s3-lib');

test('SHA-256 produit une empreinte stable', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('signature S3 génère une requête HTTPS signée', () => {
  const request = createS3Request({ endpoint: 'https://storage.example.test', bucket: 'private-bucket', key: 'orvia45/backups/a b.json', region: 'eu-west-1', accessKey: 'ACCESS123', secretKey: 'secret-value', body: Buffer.from('{"ok":true}'), now: new Date('2026-11-17T02:00:00.000Z') });
  assert.match(request.url, /^https:\/\/storage\.example\.test\/private-bucket\/orvia45\/backups\/a%20b\.json$/);
  assert.match(request.headers.authorization, /^AWS4-HMAC-SHA256 Credential=ACCESS123\/20261117\/eu-west-1\/s3\/aws4_request,/);
  assert.equal(request.headers['x-amz-date'], '20261117T020000Z');
});
test('refuse un endpoint non HTTPS', () => {
  assert.throws(() => createS3Request({ endpoint: 'http://storage.example.test', bucket: 'b', key: 'k', region: 'us-east-1', accessKey: 'a', secretKey: 's', body: 'x' }), /HTTPS/);
});
test('refuse une configuration S3 incomplète', () => {
  assert.throws(() => createS3Request({ endpoint: 'https://storage.example.test', bucket: '', key: 'k', region: 'us-east-1', accessKey: 'a', secretKey: 's', body: 'x' }), /incomplète/);
});
