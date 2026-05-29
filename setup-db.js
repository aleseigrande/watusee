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
  const dataUploadsDir = path.join(domainRoot, 'data', 'uploads', 'play');
  const publicUploadsDir = path.join(cwd, 'public', 'play', 'uploads');

  if (!fs.existsSync(dataUploadsDir)) {
    console.log('[setup-db] No data uploads dir to restore');
    return;
  }

  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }

  const files = fs.readdirSync(dataUploadsDir);
  let restored = 0;
  for (const file of files) {
    const src = path.join(dataUploadsDir, file);
    const dest = path.join(publicUploadsDir, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      restored++;
    }
  }
  console.log(`[setup-db] Restored ${restored} uploads from data/ to public/`);
}

restoreUploads();

// next build --webpack runs separately in the build script after this
