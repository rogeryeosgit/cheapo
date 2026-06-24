# Deployment Notes

Cheapo is a standard production Next.js application. It can be deployed to any host that supports Node.js, HTTPS, and long-running server processes.

## Runtime

Build the app before serving it:

```bash
npm install
npm run build
npm run start
```

The production server should bind to localhost behind a reverse proxy or platform router. Set `PORT` in the hosting environment rather than hard-coding infrastructure details in the app.

## Reverse Proxy

If self-hosting, put the app behind a reverse proxy such as nginx, Caddy, or a managed platform router. The proxy should terminate HTTPS, forward requests to the local Next.js server, and preserve standard forwarding headers:

```text
Host
X-Real-IP
X-Forwarded-For
X-Forwarded-Proto
```

## Security

Keep secrets in environment variables or the hosting provider's secret manager. Do not commit `.env` files, private keys, certificates, host-specific service files, or server paths.

For private deployments, add an access layer such as Cloudflare Access, a VPN, or platform-provided authentication in front of the app.

## Verification

After deployment, verify:

- The HTTPS homepage returns `200`.
- Plain HTTP redirects to HTTPS.
- Invalid API input returns a JSON validation error.
- Search results include source status reporting even when retailers are empty, blocked, or unsupported.
