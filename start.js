const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;

// Ensure common env vars
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = 'https://watusee.fun';
}

// Ensure DATABASE_URL is an absolute path
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:./')) {
  const dataDir = path.join(projectRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbName = process.env.DATABASE_URL?.includes('prod') ? 'prod.db' : 'dev.db';
  const dbPath = path.join(dataDir, dbName);
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Run prisma db push to ensure DB exists and schema is up to date
console.log('[start] Running prisma db push...');
try {
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env },
  });
} catch (e) {
  console.error('[start] prisma db push failed:', e.message);
  process.exit(1);
}

console.log('[start] Starting Next.js...');
const next = spawn('npx', ['next', 'start', '-p', process.env.PORT || '3000'], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
});

next.on('close', (code) => {
  console.log(`[start] Next.js exited with code ${code}`);
  process.exit(code ?? 0);
});
