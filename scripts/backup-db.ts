import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const sourceDbPath = process.env['DATABASE_PATH'] || './data/app.db';
const backupDir = './backups';

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilePath = path.join(backupDir, `mcteb-backup-${timestamp}.db`);

console.log(`Starting hot database backup from ${sourceDbPath} to ${backupFilePath}...`);

try {
  const db = new DatabaseSync(sourceDbPath);
  const normalizedPath = backupFilePath.replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${normalizedPath}'`);
  db.close();
  console.log(`Backup completed successfully: ${backupFilePath}`);
  process.exit(0);
} catch (error) {
  console.error('Failed to perform database backup:', error);
  process.exit(1);
}
