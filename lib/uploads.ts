import path from 'path';
import fs from 'fs';

export function getDataDir(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('file:/')) {
    const dbPath = dbUrl.slice(5);
    return path.dirname(dbPath);
  }
  const home = process.env.HOME || '/home';
  const cwd = process.cwd();
  const escapedHome = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const domainMatch = cwd.match(new RegExp(`^${escapedHome}/domains/[^/]+`));
  if (domainMatch) {
    return path.join(domainMatch[0], 'data');
  }
  // fallback: local dev
  return path.join(process.cwd(), 'data');
}

export function getUploadsDir(subDir: string): string {
  const dir = path.join(getDataDir(), 'uploads', subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}