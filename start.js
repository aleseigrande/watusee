const next = require('next');
const http = require('http');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`[start] Next.js ready on port ${port}`);
  });
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
});
