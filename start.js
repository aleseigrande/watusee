const { spawn } = require('child_process');

const port = process.env.PORT || 3000;
console.log(`[start] Starting Next.js on port ${port}...`);
const next = spawn('npx', ['next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

next.on('close', (code) => {
  console.log(`[start] Next.js exited with code ${code}`);
  process.exit(code ?? 0);
});
