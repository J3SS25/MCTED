import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// This script lives at Development/scripts/database/backup.ts
// When run from repo root, DATABASE_PATH is relative to root
const sourceDbPath = process.env['DATABASE_PATH'] ?? './Database/app.db';
const backupDir = './Database/backups';

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
