import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db!: Database.Database;

export function createDatabase(dbPath?: string): Database.Database {
  let usePath: string;

  if (dbPath === ":memory:" || process.env.TEST_DB_PATH === ":memory:") {
    usePath = ":memory:";
  } else {
    usePath =
      dbPath || process.env.TEST_DB_PATH
        ? path.resolve(process.env.TEST_DB_PATH!)
        : path.resolve(__dirname, "..", "data", "gen-search.db");

    if (!process.env.TEST_DB_PATH) {
      const dbDir = path.dirname(usePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }
  }

  db = new Database(usePath);

  if (usePath !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("foreign_keys = ON");
  return db;
}

export function getDb(): Database.Database {
  return db;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ancestral_villages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      surname TEXT NOT NULL,
      ancestral_hall_name TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      surnames TEXT,
      skills TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      applicant_phone TEXT,
      surname TEXT NOT NULL,
      origin_province TEXT,
      origin_city TEXT,
      origin_district TEXT,
      village_clue TEXT,
      ancestral_hall_clue TEXT,
      departure_era TEXT,
      generation_count INTEGER,
      known_ancestors TEXT,
      family_story TEXT,
      status TEXT DEFAULT 'pending',
      volunteer_id TEXT,
      current_step INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    );

    CREATE TABLE IF NOT EXISTS investigation_steps (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS pilgrimages (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      village_id TEXT,
      ancestral_hall TEXT NOT NULL,
      pilgrimage_date TEXT NOT NULL,
      companion_name TEXT,
      companion_phone TEXT,
      status TEXT DEFAULT 'scheduled',
      memories TEXT,
      story TEXT,
      photos TEXT,
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (village_id) REFERENCES ancestral_villages(id)
    );

    CREATE TABLE IF NOT EXISTS kinship_archives (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      village_id TEXT,
      confirmed_surname TEXT NOT NULL,
      relationship_type TEXT,
      ancestor_name TEXT,
      generation_level INTEGER,
      confirmation_basis TEXT,
      dna_verified INTEGER DEFAULT 0,
      archive_notes TEXT,
      confirmer_name TEXT,
      confirmed_at TEXT DEFAULT (datetime('now', 'localtime')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (village_id) REFERENCES ancestral_villages(id)
    );

    CREATE TABLE IF NOT EXISTS clue_relations (
      id TEXT PRIMARY KEY,
      source_application_id TEXT NOT NULL,
      target_application_id TEXT,
      target_village_id TEXT,
      relation_type TEXT NOT NULL,
      match_score INTEGER DEFAULT 0,
      match_reasons TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (source_application_id) REFERENCES applications(id),
      FOREIGN KEY (target_application_id) REFERENCES applications(id),
      FOREIGN KEY (target_village_id) REFERENCES ancestral_villages(id)
    );

    CREATE INDEX IF NOT EXISTS idx_kinship_application ON kinship_archives(application_id);
    CREATE INDEX IF NOT EXISTS idx_kinship_village ON kinship_archives(village_id);
    CREATE INDEX IF NOT EXISTS idx_clue_source ON clue_relations(source_application_id);
    CREATE INDEX IF NOT EXISTS idx_clue_target_app ON clue_relations(target_application_id);
    CREATE INDEX IF NOT EXISTS idx_clue_target_village ON clue_relations(target_village_id);
  `);

  const pilgrimageCols = db
    .prepare("PRAGMA table_info(pilgrimages)")
    .all() as any[];
  if (!pilgrimageCols.find((c) => c.name === "is_public")) {
    db.exec("ALTER TABLE pilgrimages ADD COLUMN is_public INTEGER DEFAULT 1");
  }

  console.log("数据库初始化完成");
  return db;
}

export default db;
