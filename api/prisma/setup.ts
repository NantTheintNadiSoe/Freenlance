import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const configuredUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = configuredUrl.replace(/^file:/, "").replace(/^\.\//, "");
const databasePath = path.resolve(process.cwd(), filePath);
const migrationPath = path.resolve(process.cwd(), "prisma/migrations/00000000000000_init/migration.sql");
const db = new Database(databasePath);
db.pragma("foreign_keys = ON");

const hasUserTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'User'").get();
if (!hasUserTable) {
  db.exec(fs.readFileSync(migrationPath, "utf8"));
  console.log(`Created SQLite schema at ${databasePath}`);
} else {
  console.log(`SQLite schema already exists at ${databasePath}`);
}
db.close();
