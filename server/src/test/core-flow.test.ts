import { describe, it, expect } from "vitest";
import { testAgent as agent } from "./setup";
import {
  createTestVolunteer,
  createTestVillage,
  createTestApplication,
  matchVolunteer,
  advanceStep,
  createKinship,
  createPilgrimage,
  completePilgrimage,
  getApplication,
  getSteps,
  getStatistics,
} from "./helpers";

describe("核心闭环流程测试", () => {
  it("完整闭环：申请→匹配→三步查访→宗亲确认→祭祖登记→完成→统计", async () => {
    const statsBefore = await getStatistics(agent);
    const pilgrimagesBefore = statsBefore.totalPilgrimages;

    const volunteerId = await createTestVolunteer(agent, {
      surnames: "李",
      province: "广东省",
      city: "广州市",
    });

    const villageId = await createTestVillage(agent, {
      surname: "李",
      province: "广东省",
      city: "广州市",
    });

    const applicationId = await createTestApplication(agent, {
      surname: "李",
      origin_province: "广东省",
      origin_city: "广州市",
    });

    let appData = await getApplication(agent, applicationId);
    expect(appData.status).toBe("pending");
    expect(appData.volunteer_id).toBeNull();
    expect(appData.current_step).toBe(0);

    let steps = await getSteps(agent, applicationId);
    expect(steps).toHaveLength(3);
    expect(steps[0].step_name).toBe("线索梳理");
    expect(steps[0].status).toBe("pending");
    expect(steps[1].step_name).toBe("实地探访");
    expect(steps[1].status).toBe("pending");
    expect(steps[2].step_name).toBe("宗亲确认");
    expect(steps[2].status).toBe("pending");

    const matchRes = await matchVolunteer(agent, applicationId, volunteerId);
    expect(matchRes.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.status).toBe("investigating");
    expect(appData.volunteer_id).toBe(volunteerId);

    steps = await getSteps(agent, applicationId);
    expect(steps[0].status).toBe("in_progress");
    expect(steps[1].status).toBe("pending");
    expect(steps[2].status).toBe("pending");

    const step0Res = await advanceStep(
      agent,
      applicationId,
      0,
      "已找到族谱记载的李家村，确认地理位置在广州天河区",
      "线索梳理完成",
    );
    expect(step0Res.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.current_step).toBe(1);

    steps = await getSteps(agent, applicationId);
    expect(steps[0].status).toBe("completed");
    expect(steps[0].result).toBe(
      "已找到族谱记载的李家村，确认地理位置在广州天河区",
    );
    expect(steps[0].notes).toBe("线索梳理完成");
    expect(steps[1].status).toBe("in_progress");
    expect(steps[2].status).toBe("pending");

    const step1Res = await advanceStep(
      agent,
      applicationId,
      1,
      "已实地走访李家村，找到李氏宗祠，采访了村中老人",
      "实地探访完成",
    );
    expect(step1Res.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.current_step).toBe(2);

    steps = await getSteps(agent, applicationId);
    expect(steps[0].status).toBe("completed");
    expect(steps[1].status).toBe("completed");
    expect(steps[1].result).toBe(
      "已实地走访李家村，找到李氏宗祠，采访了村中老人",
    );
    expect(steps[2].status).toBe("in_progress");
    expect(steps[2].id).toBeDefined();
    const step2IdBefore = steps[2].id;

    const kinshipRes = await createKinship(agent, applicationId, villageId, {
      confirmed_surname: "李",
      confirmer_name: "李村长",
    });
    expect(kinshipRes.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.status).toBe("confirmed");

    steps = await getSteps(agent, applicationId);
    expect(steps[2].id).toBe(step2IdBefore);
    expect(steps[2].status).toBe("completed");
    expect(steps[2].result).toBe("族谱记载");
    expect(steps[2].notes).toBe("测试认亲档案");

    const pilgrimageRes = await createPilgrimage(
      agent,
      applicationId,
      villageId,
      {
        pilgrimage_date: "2026-06-20",
        ancestral_hall: "李氏宗祠",
      },
    );
    expect(pilgrimageRes.body.success).toBe(true);
    const pilgrimageId = pilgrimageRes.body.data.id;

    appData = await getApplication(agent, applicationId);
    expect(appData.pilgrimage).not.toBeNull();
    expect(appData.pilgrimage.id).toBe(pilgrimageId);
    expect(appData.pilgrimage.status).toBe("scheduled");

    const completeRes = await completePilgrimage(agent, pilgrimageId);
    expect(completeRes.body.success).toBe(true);

    appData = await getApplication(agent, applicationId);
    expect(appData.status).toBe("completed");
    expect(appData.pilgrimage.status).toBe("completed");

    steps = await getSteps(agent, applicationId);
    expect(steps[2].status).toBe("completed");

    const statsAfter = await getStatistics(agent);
    expect(statsAfter.totalPilgrimages).toBe(pilgrimagesBefore + 1);
    expect(statsAfter.statusBreakdown.completed).toBe(1);
  });
});
