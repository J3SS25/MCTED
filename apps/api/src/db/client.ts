import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Ensure database directory exists
const dbDir = path.dirname(env.DATABASE_PATH_RESOLVED);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const rawDb = new DatabaseSync(env.DATABASE_PATH_RESOLVED);

// Apply recommended SQLite pragmas
rawDb.exec('PRAGMA journal_mode = WAL;');
rawDb.exec('PRAGMA foreign_keys = ON;');
rawDb.exec('PRAGMA busy_timeout = 5000;');
rawDb.exec('PRAGMA synchronous = NORMAL;');

export interface RunResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export interface Statement<T = unknown> {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): T | undefined;
  all(...params: unknown[]): T[];
}

export interface AppDatabase {
  prepare<T = unknown>(sql: string): Statement<T>;
  exec(sql: string): void;
  transaction<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R;
  pragma(sql: string): void;
  close(): void;
}

export const db: AppDatabase = {
  prepare<T = unknown>(sql: string): Statement<T> {
    const stmt = rawDb.prepare(sql);
    return {
      run(...params: unknown[]): RunResult {
        return stmt.run(...(params as any[]));
      },
      get(...params: unknown[]): T | undefined {
        return stmt.get(...(params as any[])) as T | undefined;
      },
      all(...params: unknown[]): T[] {
        return stmt.all(...(params as any[])) as T[];
      },
    };
  },
  exec(sql: string): void {
    rawDb.exec(sql);
  },
  transaction<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R {
    return (...args: Args): R => {
      rawDb.exec('BEGIN IMMEDIATE');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  },
  pragma(sql: string): void {
    rawDb.exec(`PRAGMA ${sql};`);
  },
  close(): void {
    rawDb.close();
  },
};

logger.info(`SQLite connected: ${env.DATABASE_PATH_RESOLVED}`);

export default db;
