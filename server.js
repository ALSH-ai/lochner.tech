const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

loadDotEnv(path.join(__dirname, '.env'));

const ROOT_DIR = __dirname;
const HTTP_PORT = parsePort(process.env.HTTP_PORT, 80);
const HTTPS_PORT = parsePort(process.env.HTTPS_PORT, 443);

const TLS_KEY_PATH = process.env.TLS_KEY_PATH;
const TLS_CERT_PATH = process.env.TLS_CERT_PATH;
const TLS_CHAIN_PATH = process.env.TLS_CHAIN_PATH;

if (!TLS_KEY_PATH || !TLS_CERT_PATH) {
  console.error(
    'Missing TLS env vars. Set TLS_KEY_PATH and TLS_CERT_PATH in .env to your certbot files.'
  );
  process.exit(1);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const requestHandler = (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relativePath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(ROOT_DIR, relativePath));

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      respond404(res);
      return;
    }

    const resolvedPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;

    fs.readFile(resolvedPath, (readErr, data) => {
      if (readErr) {
        respond404(res);
        return;
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
};

http.createServer(requestHandler).listen(HTTP_PORT, () => {
  console.log(`HTTP server listening on port ${HTTP_PORT}`);
});

const httpsOptions = {
  key: fs.readFileSync(resolveTlsPath(TLS_KEY_PATH)),
  cert: fs.readFileSync(resolveTlsPath(TLS_CERT_PATH)),
};

if (TLS_CHAIN_PATH) {
  httpsOptions.ca = fs.readFileSync(resolveTlsPath(TLS_CHAIN_PATH));
}

https.createServer(httpsOptions, requestHandler).listen(HTTPS_PORT, () => {
  console.log(`HTTPS server listening on port ${HTTPS_PORT}`);
});

function resolveTlsPath(tlsPath) {
  return path.isAbsolute(tlsPath) ? tlsPath : path.resolve(ROOT_DIR, tlsPath);
}

function parsePort(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function respond404(res) {
  const fallbackPage = path.join(ROOT_DIR, '50x.html');
  fs.readFile(fallbackPage, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
