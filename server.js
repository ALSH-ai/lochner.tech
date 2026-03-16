const fs = require('fs');
const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');

const ROOT_DIR = __dirname;
const HTTP_PORT = 80;
const HTTPS_PORT = 443;

const TLS_CERTIFICATES = [
  {
    servername: 'lochner.tech',
    keyPath: '/etc/letsencrypt/live/lochner.tech/privkey.pem',
    certPath: '/etc/letsencrypt/live/lochner.tech/fullchain.pem',
  },
  {
    servername: 'www.lochner.tech',
    keyPath: '/etc/letsencrypt/live/www.lochner.tech/privkey.pem',
    certPath: '/etc/letsencrypt/live/www.lochner.tech/fullchain.pem',
  },
];

const tlsContexts = TLS_CERTIFICATES.map(({ servername, keyPath, certPath }) => {
  const key = fs.readFileSync(keyPath);
  const cert = fs.readFileSync(certPath);

  return {
    servername,
    context: tls.createSecureContext({ key, cert }),
    key,
    cert,
  };
});

if (tlsContexts.length === 0) {
  console.error('No TLS certificates configured.');
  process.exit(1);
}

const defaultTlsContext = tlsContexts[0];

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
  key: defaultTlsContext.key,
  cert: defaultTlsContext.cert,
  SNICallback(servername, cb) {
    const match = tlsContexts.find((tlsContext) => tlsContext.servername === servername);
    const context = match ? match.context : defaultTlsContext.context;

    if (cb) {
      cb(null, context);
      return;
    }

    return context;
  },
};

https.createServer(httpsOptions, requestHandler).listen(HTTPS_PORT, () => {
  console.log(`HTTPS server listening on port ${HTTPS_PORT}`);
});

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
