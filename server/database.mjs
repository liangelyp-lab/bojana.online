import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, role TEXT NOT NULL, project_id TEXT, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL, published_data TEXT, password_hash TEXT, link_token_hash TEXT);
    CREATE TABLE IF NOT EXISTS folders (project_id TEXT NOT NULL, discipline TEXT NOT NULL, provider_id TEXT NOT NULL, PRIMARY KEY(project_id, discipline));
    CREATE TABLE IF NOT EXISTS deliverables (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, discipline TEXT NOT NULL, need_id TEXT NOT NULL, task_id TEXT NOT NULL, provider_file_id TEXT NOT NULL UNIQUE, metadata TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS task_files ON deliverables(project_id, task_id);
  `);
  return db;
}
