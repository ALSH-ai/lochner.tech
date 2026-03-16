# lochner.tech static site host

This repository includes a Node.js server to host the static website files over both HTTP and HTTPS.

## Certificate configuration

The server is configured with hardcoded certbot paths and serves both domains simultaneously via SNI:

- `lochner.tech`
  - `/etc/letsencrypt/live/lochner.tech/privkey.pem`
  - `/etc/letsencrypt/live/lochner.tech/fullchain.pem`
- `www.lochner.tech`
  - `/etc/letsencrypt/live/www.lochner.tech/privkey.pem`
  - `/etc/letsencrypt/live/www.lochner.tech/fullchain.pem`

If your cert paths change, update `TLS_CERTIFICATES` in `server.js`.

## Run

```bash
npm start
```

The server will:
- Serve the site on port `80` (HTTP)
- Serve the site on port `443` (HTTPS)
- Select the correct certificate for `lochner.tech` and `www.lochner.tech` using SNI
