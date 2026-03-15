# lochner.tech static site host

This repository now includes a Node.js server to host the static website files over both HTTP and HTTPS.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set certbot paths:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your real certificate paths.

## Run

```bash
npm start
```

The server will:
- Serve the site on `HTTP_PORT` (default `80`)
- Serve the site on `HTTPS_PORT` (default `443`)
- Use certbot cert paths from `.env` (`TLS_KEY_PATH`, `TLS_CERT_PATH`, optional `TLS_CHAIN_PATH`)
