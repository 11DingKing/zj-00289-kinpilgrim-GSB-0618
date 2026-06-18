import { describe, it, expect } from "vitest";
import { testAgent as agent } from "./setup";
import { getDb } from "../database";
import {
  createTestVolunteer,
  createTestVillage,
  createTestApplication,
  matchVolunteer,
  advanceStep,
  createPilgrimage,
  getApplication,
  getSteps,
} from "./helpers";

describe("边界条件测试", () => {
  it("未宗亲确认不准登记祭祖行程", async () => {
    const db = getDb();
    const volunteerId = await createTestVolunteer(agent);
    const villageId = await createTestVillage(agent);
    const applicationId = await createTestApplication(agent);

    await matchVolunteer(agent, applicationId, volunteerId);

    const pilgrimageRes1 = await createPilgrimage(agent, applicationId, villageId);
    expect(pilgrimageRes1.body.success).toBe(false);
    expect(pilgrimageRes1.body.message).toBe(
      "宗亲确认完成后才能登记祭祖行程",
    );

    await advanceStep(agent, applicationId, 0, "线索梳理完成");
    const pilgrimageRes2 = await createPilgrimage(agent, applicationId, villageId);
    expect(pilgrimageRes2.body.success).toBe(false);
    expect(pilgrimageRes2.body.message).toBe(
      "宗亲确认完成后才能登记祭祖行程",
    );

    await advanceStep(agent, applicationId, 1, "实地探访完成");
    const pilgrimageRes3 = await createPilgrimage(agent, applicationId, villageId);
    expect(pilgrimageRes3.body.success).toBe(false);
    expect(pilgrimageRes3.body.message).toBe(
      "宗亲确认完成后才能登记祭祖行程",
    );

    let appData = await getApplication(agent, applicationId);
    expect(appData.pilgrimage).toBeNull();

    db.prepare(
      "UPDATE applications SET status = 'confirmed' WHERE id = ?",
    ).run(applicationId);

    const pilgrimageRes4 = await createPilgrimage(agent, applicationId, villageId);
    expect(pilgrimageRes4.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.pilgrimage).not.toBeNull();
  });

  it("申请标记线索中断后不能再推进", async () => {
    const db = getDb();
    const volunteerId = await createTestVolunteer(agent);
    const applicationId = await createTestApplication(agent);

    await matchVolunteer(agent, applicationId, volunteerId);

    await advanceStep(agent, applicationId, 0, "线索梳理完成");

    let steps = await getSteps(agent, applicationId);
    expect(steps[0].status).toBe("completed");
    expect(steps[1].status).toBe("in_progress");

    db.prepare(
      "UPDATE applications SET status = 'broken' WHERE id = ?",
    ).run(applicationId);

    const step1Res = await advanceStep(
      agent,
      applicationId,
      1,
      "尝试推进实地探访",
    );
    expect(step1Res.body.success).toBe(false);
    expect(step1Res.body.message).toBe(
      "申请已标记线索中断，无法继续推进",
    );

    const statusRes = await agent
      .put(`/api/applications/${applicationId}/status`)
      .send({ status: "investigating" });
    expect(statusRes.body.success).toBe(false);
    expect(statusRes.body.message).toBe(
      "申请已标记线索中断，无法继续推进",
    );

    steps = await getSteps(agent, applicationId);
    expect(steps[1].status).toBe("in_progress");

    const appData = await getApplication(agent, applicationId);
    expect(appData.status).toBe("broken");
  });

  it("同一条申请不能重复匹配两个志愿者", async () => {
    const volunteerId1 = await createTestVolunteer(agent, { name: "志愿者A" });
    const volunteerId2 = await createTestVolunteer(agent, { name: "志愿者B" });
    const applicationId = await createTestApplication(agent);

    const matchRes1 = await matchVolunteer(agent, applicationId, volunteerId1);
    expect(matchRes1.body.success).toBe(true);

    let appData = await getApplication(agent, applicationId);
    expect(appData.volunteer_id).toBe(volunteerId1);
    expect(appData.status).toBe("investigating");

    const matchRes2 = await matchVolunteer(agent, applicationId, volunteerId2);
    expect(matchRes2.body.success).toBe(false);
    expect(matchRes2.body.message).toBe(
      "该申请已匹配志愿者，不能重复匹配",
    );

    appData = await getApplication(agent, applicationId);
    expect(appData.volunteer_id).toBe(volunteerId1);
    expect(appData.status).toBe("investigating");
  });
});
