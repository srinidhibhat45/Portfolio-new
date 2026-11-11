// Runs the real leaderboard function once for the local preview (tools/serve_portfolio.py calls it per request).
// Reads {method, url, origin, contentType, body, ip, file} as JSON on stdin and prints {status, body}.
// The board is kept in a JSON file under .local/, standing in for Netlify Blobs.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { handleRide } from '../netlify/functions/ride.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const data = existsSync(input.file) ? JSON.parse(readFileSync(input.file, 'utf8')) : {};
let etag = Object.values(data).reduce((n, v) => Math.max(n, Number(v.etag) || 0), 0);
const store = {
  async get(key) { return data[key]?.data ?? null; },
  async getWithMetadata(key) { return data[key] ? { data: data[key].data, etag: data[key].etag } : null; },
  async setJSON(key, value, o = {}) {
    const prev = data[key];
    if (o.onlyIfNew && prev || o.onlyIfMatch && prev?.etag !== o.onlyIfMatch) return { modified: false };
    data[key] = { data: value, etag: String(++etag) }; return { modified: true };
  },
  async delete(key) { delete data[key]; },
  async list({ prefix }) { return { blobs: Object.keys(data).filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
};
const headers = {};
if (input.origin) headers.origin = input.origin;
if (input.contentType) headers['content-type'] = input.contentType;
const request = new Request(input.url, { method: input.method, headers, body: input.method === 'POST' ? input.body : undefined });
const response = await handleRide(request, { ip: input.ip }, { store: () => store });
mkdirSync(dirname(input.file), { recursive: true });
writeFileSync(input.file, JSON.stringify(data));
process.stdout.write(JSON.stringify({ status: response.status, body: await response.text() }));
