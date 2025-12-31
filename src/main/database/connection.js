// src/main/database/connection.js
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const userDataPath = app.getPath('userData'); // User-specific folder
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath);

const dbFileName = 'tharindu_tea_center.db';
const dbPath = path.join(userDataPath, dbFileName);

// Default DB path inside resources (packaged with exe)
const defaultDb = path.join(process.resourcesPath, dbFileName);

// Copy default DB to userData if it doesn't exist
if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(defaultDb)) {
        fs.copyFileSync(defaultDb, dbPath);
        console.log(`📁 Default DB copied to userData at: ${dbPath}`);
    } else {
        console.log(`⚠️ No default DB found in resources. Creating new DB at: ${dbPath}`);
    }
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log("✅ Database connected at:", dbPath);

export default db;
