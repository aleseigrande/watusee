const next = require('next');
const http = require('http');

process.on('uncaughtException', (err) => {
  console.error('[start] UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[start] UNHANDLED REJECTION:', reason);
});

const port = parseInt(process.env.PORT || '3000', 10);
console.log('[start] Node version:', process.version);
console.log('[start] CWD:', process.cwd());
console.log('[start] NODE_ENV:', process.env.NODE_ENV);
console.log('[start] Starting Next.js...');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('[start] Request error:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, () => {
    console.log(`[start] Next.js ready on port ${port}`);
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}).catch((err) => {
  console.error('[start] Failed to prepare Next.js:', err);
  process.exit(1);
});
