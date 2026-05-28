const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || 3000;
const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
console.log(`[start] Starting Next.js on port ${port}...`);
const next = spawn(process.platform === 'win32' ? 'next.cmd' : nextBin, ['start', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

next.on('close', (code) => {
  console.log(`[start] Next.js exited with code ${code}`);
  process.exit(code ?? 0);
});

process.on('SIGTERM', () => next.kill('SIGTERM'));
process.on('SIGINT', () => next.kill('SIGINT'));
