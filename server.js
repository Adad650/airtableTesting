/**
 * Airtable proxy for Render.com
 * Set env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
 * Frontend (e.g. GitHub Pages) calls this API; this server calls Airtable with the token.
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
  console.error('Missing env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const AIRTABLE_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

const AUTH_HEADERS = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json',
};

// Allow your GitHub Pages origin (and localhost for dev)
function corsHeaders(origin) {
  const allowed = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://localhost:8080',
    /^https:\/\/[a-zA-Z0-9-]+\.github\.io$/,
    /^https:\/\/[a-zA-Z0-9-]+\.github\.pages\.dev$/,
  ];
  const ok = origin && allowed.some(a => typeof a === 'string' ? a === origin : a.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handle(req, res) {
  const origin = req.headers.origin || '';
  const headers = { ...corsHeaders(origin) };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  if (url.pathname !== '/api/records' && url.pathname !== '/api/records/') {
    res.writeHead(404, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use GET/POST /api/records, PATCH/DELETE /api/records' }));
    return;
  }

  let body = null;
  if (req.method === 'POST' || req.method === 'PATCH') {
    body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : null); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });
  }

  let airtableUrl = AIRTABLE_BASE;
  let method = req.method;
  if (method === 'DELETE') {
    const ids = url.searchParams.getAll('records[]');
    airtableUrl = ids.length ? `${AIRTABLE_BASE}?${ids.map(id => `records[]=${id}`).join('&')}` : AIRTABLE_BASE;
  }

  const opts = {
    method,
    headers: AUTH_HEADERS,
  };
  if (body && (method === 'POST' || method === 'PATCH')) {
    opts.body = JSON.stringify(body);
  }

  try {
    const r = await fetch(airtableUrl, opts);
    const text = await r.text();
    const contentType = r.headers.get('content-type') || 'application/json';
    res.writeHead(r.status, { ...headers, 'Content-Type': contentType });
    res.end(text);
  } catch (e) {
    res.writeHead(500, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}

const server = require('http').createServer(handle);
server.listen(PORT, () => console.log(`Airtable proxy listening on port ${PORT}`));
