import * as SQLite from 'expo-sqlite';
const database = SQLite.openDatabaseSync('smartcrop.db');
database.execSync('CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)');
export function saveCache(key: string, value: unknown) { database.runSync('INSERT OR REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)', [key, JSON.stringify(value), new Date().toISOString()]); }
export function readCache<T>(key: string): T | null { const row = database.getFirstSync<{ value: string }>('SELECT value FROM cache WHERE key = ?', [key]); return row ? JSON.parse(row.value) : null; }
