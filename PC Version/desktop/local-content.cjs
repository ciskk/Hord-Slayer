const path = require('node:path');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'";

function resolveContent(root, requestUrl) {
  const url = new URL(requestUrl);
  if (url.protocol !== 'app:' || url.hostname !== 'game' || url.port || url.username || url.password) throw new Error('Origem inválida');
  const relative = decodeURIComponent(url.pathname);
  if (relative.includes('\\') || relative.includes('\0')) throw new Error('Caminho inválido');
  const target = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  const within = path.relative(root, target);
  if (!within || within.startsWith('..') || path.isAbsolute(within)) throw new Error('Caminho inválido');
  return { target, type: MIME[path.extname(target)] || 'application/octet-stream' };
}
module.exports = { resolveContent, CSP };
