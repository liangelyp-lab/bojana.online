import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.mjs';
import { createApp } from './app.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = {
  appUrl: process.env.APP_URL,
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  encryptionKey: Buffer.from(process.env.STORAGE_ENCRYPTION_KEY || '', 'hex'),
  passwordHash: process.env.STUDIO_PASSWORD_HASH,
  pickerApiKey: process.env.GOOGLE_PICKER_API_KEY,
  projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER,
  maxUploadBytes: Number(process.env.STORAGE_MAX_UPLOAD_MB || 50) * 1048576
};
if (!Number.isSafeInteger(config.maxUploadBytes) || config.maxUploadBytes <= 0) throw new Error('STORAGE_MAX_UPLOAD_MB must be a positive integer.');
const db = openDatabase(process.env.STORAGE_DB_PATH || path.join(root, '.data/storage.sqlite'));
const app = createApp({ db, config });
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
}
const server = app.listen(Number(process.env.API_PORT || 3001), '0.0.0.0', () => process.stdout.write('Bojana storage API ready\n'));
function close() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGTERM', close); process.on('SIGINT', close);
