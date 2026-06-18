import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../database";

export async function createTestVolunteer(agent: request.SuperTest<any>, overrides: any = {}) {
  const res = await agent.post("/api/volunteers").send({
    name: `测试志愿者_${uuidv4().slice(0, 8)}`,
    phone: "13800138000",
    province: "广东省",
    city: "广州市",
    district: "天河区",
    surnames: "李,王,张",
    skills: "族谱研究,实地走访",
    ...overrides,
  });
  return res.body.data.id;
}

export async function createTestVillage(agent: request.SuperTest<any>, overrides: any = {}) {
  const res = await agent.post("/api/villages").send({
    name: `测试村_${uuidv4().slice(0, 8)}`,
    province: "广东省",
    city: "广州市",
    district: "天河区",
    surname: "李",
    ancestral_hall_name: "李氏宗祠",
    description: "测试村落",
    ...overrides,
  });
  return res.body.data.id;
}

export async function createTestApplication(agent: request.SuperTest<any>, overrides: any = {}) {
  const res = await agent.post("/api/applications").send({
    applicant_name: `测试申请人_${uuidv4().slice(0, 8)}`,
    applicant_phone: "13900139000",
    surname: "李",
    origin_province: "广东省",
    origin_city: "广州市",
    origin_district: "天河区",
    village_clue: "李家村",
    ancestral_hall_clue: "李氏宗祠",
    departure_era: "清末",
    generation_count: 5,
    known_ancestors: "李太公",
    family_story: "祖上从广州迁出",
    ...overrides,
  });
  return res.body.data.id;
}

export async function matchVolunteer(
  agent: request.SuperTest<any>,
  applicationId: string,
  volunteerId: string,
) {
  return await agent.put(`/api/applications/${applicationId}/match`).send({
    volunteer_id: volunteerId,
  });
}

export async function advanceStep(
  agent: request.SuperTest<any>,
  applicationId: string,
  stepIndex: number,
  result: string,
  notes?: string,
) {
  return await agent.put(`/api/applications/${applicationId}/status`).send({
    step_index: stepIndex,
    step_result: result,
    step_notes: notes,
  });
}

export async function createKinship(
  agent: request.SuperTest<any>,
  applicationId: string,
  villageId: string,
  overrides: any = {},
) {
  return await agent.post("/api/kinship").send({
    application_id: applicationId,
    village_id: villageId,
    confirmed_surname: "李",
    relationship_type: "同宗",
    ancestor_name: "李太公",
    generation_level: 5,
    confirmation_basis: "族谱记载",
    dna_verified: false,
    archive_notes: "测试认亲档案",
    confirmer_name: "李村长",
    ...overrides,
  });
}

export async function createPilgrimage(
  agent: request.SuperTest<any>,
  applicationId: string,
  villageId: string,
  overrides: any = {},
) {
  return await agent.post("/api/pilgrimages").send({
    application_id: applicationId,
    village_id: villageId,
    ancestral_hall: "李氏宗祠",
    pilgrimage_date: "2026-06-15",
    companion_name: "家人",
    companion_phone: "13700137000",
    ...overrides,
  });
}

export async function completePilgrimage(agent: request.SuperTest<any>, pilgrimageId: string) {
  return await agent.put(`/api/pilgrimages/${pilgrimageId}/complete`).send({
    memories: "非常感动",
    story: "寻根成功",
    photos: "",
  });
}

export async function getApplication(agent: request.SuperTest<any>, applicationId: string) {
  const res = await agent.get(`/api/applications/${applicationId}`);
  return res.body.data;
}

export async function getSteps(agent: request.SuperTest<any>, applicationId: string) {
  const res = await agent.get(`/api/applications/${applicationId}/steps`);
  return res.body.data;
}

export async function getStatistics(agent: request.SuperTest<any>) {
  const res = await agent.get("/api/statistics/overview");
  return res.body.data;
}

export function cleanAllTestData() {
  const db = getDb();
  db.prepare("DELETE FROM clue_relations").run();
  db.prepare("DELETE FROM kinship_archives").run();
  db.prepare("DELETE FROM pilgrimages").run();
  db.prepare("DELETE FROM investigation_steps").run();
  db.prepare("DELETE FROM applications").run();
  db.prepare("DELETE FROM volunteers").run();
  db.prepare("DELETE FROM ancestral_villages").run();
}
