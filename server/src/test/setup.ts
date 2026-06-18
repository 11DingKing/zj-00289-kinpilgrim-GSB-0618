import { beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { createDatabase, initDatabase, getDb } from "../database";

process.env.TEST_DB_PATH = ":memory:";

export let testApp: Express.Application;
export let testAgent: request.SuperTest<any>;

beforeAll(() => {
  createDatabase(":memory:");
  initDatabase();
  testApp = createApp();
  testAgent = request.agent(testApp);
});

beforeEach(() => {
  const db = getDb();
  db.prepare("DELETE FROM clue_relations").run();
  db.prepare("DELETE FROM kinship_archives").run();
  db.prepare("DELETE FROM pilgrimages").run();
  db.prepare("DELETE FROM investigation_steps").run();
  db.prepare("DELETE FROM applications").run();
  db.prepare("DELETE FROM volunteers").run();
  db.prepare("DELETE FROM ancestral_villages").run();
});
