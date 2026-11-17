'use strict';
const crypto = require('node:crypto');
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hmac(key, value, encoding) { return crypto.createHmac('sha256', key).update(value).digest(encoding); }
function awsEncodePath(value) { return value.split('/').map(part => encodeURIComponent(decodeURIComponent(part)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join('/'); }
function createS3Request({ endpoint, bucket, key, region, accessKey, secretKey, body, now = new Date() }) {
  const base = new URL(endpoint);
  if (!['https:'].includes(base.protocol)) throw new Error('S3_ENDPOINT doit utiliser HTTPS.');
  if (!bucket || !key || !region || !accessKey || !secretKey) throw new Error('Configuration S3 incomplète.');
  const path = `${base.pathname.replace(/\/$/, '')}/${awsEncodePath(bucket)}/${awsEncodePath(key)}`.replace(/^$/, '/');
  const url = new URL(base.origin);
  url.pathname = path.startsWith('/') ? path : `/${path}`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const headers = { host: url.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, 'content-type': 'application/json' };
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `content-type:${headers['content-type']}\nhost:${headers.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const canonicalRequest = `PUT\n${url.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`;
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { url: url.toString(), headers };
}
module.exports = { sha256, createS3Request };
