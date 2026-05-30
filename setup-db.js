const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const home = process.env.HOME || '/home';
const escapedHome = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const domainMatch = cwd.match(new RegExp(`^${escapedHome}/domains/[^/]+`));

if (domainMatch) {
  const domainRoot = domainMatch[0];
  const dataDir = path.join(domainRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'watusee.db');
  process.env.DATABASE_URL = `file:${dbPath}`;

  console.log(`[setup-db] Domain root: ${domainRoot}`);
  console.log(`[setup-db] DB path: ${dbPath}`);

  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    cwd,
    env: { ...process.env },
    timeout: 30000,
  });
} else {
  console.log(`[setup-db] CWD: ${cwd}, HOME: ${home}`);
  console.log('[setup-db] Domain regex did not match');

  // Even if regex fails, try to create data dir from the panel DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('file:/')) {
    const dbPath = dbUrl.slice(5);
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`[setup-db] Created data dir from env var: ${dataDir}`);
    }
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      cwd,
      env: { ...process.env },
      timeout: 30000,
    });
  } else {
    console.log('[setup-db] No DATABASE_URL with file:/ path, skipping DB setup');
  }
}

function restoreDir(dataDir, publicDir) {
  if (!fs.existsSync(dataDir)) return 0;
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const files = fs.readdirSync(dataDir);
  let restored = 0;
  for (const file of files) {
    const src = path.join(dataDir, file);
    const dest = path.join(publicDir, file);
    if (!fs.existsSync(dest)) {
      try { fs.copyFileSync(src, dest); restored++; } catch {}
    }
  }
  return restored;
}

function restoreUploads() {
  const cwd = process.cwd();
  const home = process.env.HOME || '/home';
  const escapedHome = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const domainMatch = cwd.match(new RegExp(`^${escapedHome}/domains/[^/]+`));
  if (!domainMatch) {
    console.log('[setup-db] Not in a domain path, skipping upload restore');
    return;
  }
  const domainRoot = domainMatch[0];
  const dataRoot = path.join(domainRoot, 'data', 'uploads');

  const pairs = [
    { data: path.join(dataRoot, 'play'), pub: path.join(cwd, 'public', 'play', 'uploads') },
    { data: path.join(dataRoot, 'uploads'), pub: path.join(cwd, 'public', 'uploads') },
    { data: path.join(dataRoot, 'uploads', 'adults'), pub: path.join(cwd, 'public', 'uploads', 'adults') },
  ];

  let total = 0;
  for (const p of pairs) {
    const n = restoreDir(p.data, p.pub);
    if (n > 0) console.log(`[setup-db] Restored ${n} files to ${p.pub}`);
    total += n;
  }
  console.log(`[setup-db] Restored ${total} total uploads`);
}

restoreUploads();

// next build --webpack runs separately in the build script after this
