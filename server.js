const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX_FILE = 'bells n barz (main file).html';
const PORT = process.env.PORT || 3000;
const PUBLIC_FILES = [INDEX_FILE, 'manifest.json', 'icon.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'sw.js'];
const PUBLIC_DIRS = ['css', 'js', 'docs'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // A malformed escape like %E0%A4%A makes decodeURIComponent throw; left
  // uncaught, that one request takes the whole server down.
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }
  if (urlPath === '/') urlPath = '/' + INDEX_FILE;

  // Only serve what the site itself uses — the same set the GitHub Pages
  // deploy publishes — never .git/, sql/, backups or this file. Checked on
  // the path relative to ROOT, so a sibling folder whose name merely
  // starts the same (…-subfolders-old) can't slip past a prefix test.
  const filePath = path.normalize(path.join(ROOT, urlPath));
  const rel = path.relative(ROOT, filePath);
  const top = rel.split(path.sep)[0];
  const isPublic = !rel.startsWith('..') && !path.isAbsolute(rel) &&
    (PUBLIC_FILES.includes(rel) || (PUBLIC_DIRS.includes(top) && rel !== top));
  if (!isPublic) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + urlPath);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Bells n Barz running at http://localhost:${PORT}`);
});
