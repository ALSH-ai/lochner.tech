const fs = require('fs');
const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');

const ROOT_DIR = __dirname;
const HTTP_PORT = resolveHttpPort(process.argv.slice(2));
const HTTPS_PORT = 443;
const COPYRIGHT_YEAR = new Date().getFullYear();
const NON_PUBLIC_PATH_PREFIXES = ['/alsh-logo-generator', '/alsh-logo-generator/'];
const PUBLIC_FILE_OVERRIDES = new Set(['/alsh-logo-generator/alsh-logo.png']);

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

const tlsContexts = TLS_CERTIFICATES.flatMap(({ servername, keyPath, certPath }) => {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('='.repeat(92));
    console.error(
      `!!! LOUD WARNING: TLS CERTIFICATE MISSING FOR ${servername.toUpperCase()} !!!`
    );
    console.error(`Missing key path:  ${keyPath}`);
    console.error(`Missing cert path: ${certPath}`);
    console.error('HTTPS for this host is DISABLED until the certificate files exist.');
    console.error('='.repeat(92));
    return [];
  }

  const key = fs.readFileSync(keyPath);
  const cert = fs.readFileSync(certPath);

  return [
    {
      servername,
      context: tls.createSecureContext({ key, cert }),
      key,
      cert,
    },
  ];
});

const defaultTlsContext = tlsContexts[0] || null;

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
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const SHARED_HEADER_TEMPLATE = `
  <header class="site-header">
    <h1><a class="site-title-link" href="/">Lochner Technology</a></h1>
    <p>Lochner Technology builds developer software and AI-assisted workflow tools.</p>
    <div class="cta-buttons">
      <a class="cta-button" href="https://www.linkedin.com/in/nicholaslochner/" target="_blank" rel="noopener" title="Open LinkedIn profile">
        LinkedIn
      </a>
      <a class="cta-button" href="https://github.com/lochner-lw" target="_blank" rel="noopener" title="Open GitHub profile">
        GitHub
        <span class="cta-button-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.49 7.49 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
          </svg>
        </span>
      </a>
      <a class="cta-button" href="https://www.npmjs.com/~lochner-lw" target="_blank" rel="noopener" title="Open npm profile">
        NPM
      </a>
    </div>
    <p class="banner-email"><a href="mailto:engineering@lochner.tech">engineering@lochner.tech</a></p>
  </header>
`;

const SHARED_FOOTER_TEMPLATE = `
  <footer class="site-footer">
    <small>© ${COPYRIGHT_YEAR} Lochner Technology · Minneapolis, MN</small>
  </footer>
`;

const requestHandler = (req, res) => {
  const urlPath = decodeRequestPath(req.url);
  if (urlPath === null) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  const relativePath = urlPath === '/' ? '/index.html' : urlPath;

  if (!PUBLIC_FILE_OVERRIDES.has(relativePath) && NON_PUBLIC_PATH_PREFIXES.some((prefix) => relativePath === prefix || relativePath.startsWith(prefix))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const filePath = path.normalize(path.join(ROOT_DIR, relativePath));

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      const fallbackPath = path.normalize(path.join(ROOT_DIR, `${relativePath}.html`));
      const fallbackWithinRoot = fallbackPath.startsWith(ROOT_DIR);

      if (!fallbackWithinRoot) {
        respond404(res);
        return;
      }

      fs.stat(fallbackPath, (fallbackErr, fallbackStats) => {
        if (fallbackErr || !fallbackStats.isFile()) {
          respond404(res);
          return;
        }

        servePath(fallbackPath, res);
      });
      return;
    }

    const resolvedPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    servePath(resolvedPath, res);
  });
};

function servePath(resolvedPath, res) {
  fs.readFile(resolvedPath, (readErr, data) => {
    if (readErr) {
      respond404(res);
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const responseData = ext === '.html'
      ? applySharedTemplate(data.toString('utf8'))
      : data;

    const headers = { 'Content-Type': contentType };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers.Pragma = 'no-cache';
      headers.Expires = '0';
    }

    res.writeHead(200, headers);
    res.end(responseData);
  });
}

if (defaultTlsContext) {
  http
    .createServer((req, res) => {
      const host = req.headers.host || 'lochner.tech';
      const redirectUrl = `https://${host}${req.url || '/'}`;

      res.writeHead(301, {
        Location: redirectUrl,
        'Content-Type': 'text/plain; charset=utf-8',
      });
      res.end(`Redirecting to ${redirectUrl}`);
    })
    .listen(HTTP_PORT, () => {
      console.log(`HTTP redirect server listening on port ${HTTP_PORT}`);
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
} else {
  console.error('='.repeat(92));
  console.error('!!! LOUD WARNING: NO TLS CERTIFICATES FOUND. SERVING HTTP ONLY. !!!');
  console.error('HTTPS is DISABLED until certificate files are present.');
  console.error('='.repeat(92));
  http.createServer(requestHandler).listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on port ${HTTP_PORT}`);
  });
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

function decodeRequestPath(rawUrl) {
  const rawPath = (rawUrl || '/').split('?')[0];

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return null;
  }
}

function resolveHttpPort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg !== '-p' && arg !== '--port') {
      continue;
    }

    const value = argv[index + 1];
    const port = Number(value);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error(`Invalid port value for ${arg}: ${value}`);
      process.exit(1);
    }

    return port;
  }

  return 80;
}

function applySharedTemplate(html) {
  return html
    .replace('<!-- SHARED_HEADER -->', SHARED_HEADER_TEMPLATE)
    .replace('<!-- SHARED_FOOTER -->', SHARED_FOOTER_TEMPLATE);
}
