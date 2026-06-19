import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

interface MatchReason {
  field: string;
  score: number;
  reason: string;
}

function calculateMatchScore(
  app: any,
  target: any,
  type: "application" | "village",
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let totalScore = 0;

  if (type === "application") {
    if (app.surname && target.surname && app.surname === target.surname) {
      totalScore += 30;
      reasons.push({ field: "surname", score: 30, reason: "姓氏相同" });
    }

    if (
      app.origin_province &&
      target.origin_province &&
      app.origin_province === target.origin_province
    ) {
      totalScore += 15;
      reasons.push({ field: "province", score: 15, reason: "祖籍省份相同" });
    }

    if (
      app.origin_city &&
      target.origin_city &&
      app.origin_city === target.origin_city
    ) {
      totalScore += 15;
      reasons.push({ field: "city", score: 15, reason: "祖籍城市相同" });
    }

    if (
      app.origin_district &&
      target.origin_district &&
      app.origin_district === target.origin_district
    ) {
      totalScore += 10;
      reasons.push({ field: "district", score: 10, reason: "祖籍区县相同" });
    }

    if (
      app.village_clue &&
      target.village_clue &&
      (app.village_clue.includes(target.village_clue) ||
        target.village_clue.includes(app.village_clue))
    ) {
      totalScore += 20;
      reasons.push({ field: "village", score: 20, reason: "村落线索相关" });
    }

    if (
      app.ancestral_hall_clue &&
      target.ancestral_hall_clue &&
      (app.ancestral_hall_clue.includes(target.ancestral_hall_clue) ||
        target.ancestral_hall_clue.includes(app.ancestral_hall_clue))
    ) {
      totalScore += 10;
      reasons.push({ field: "hall", score: 10, reason: "宗祠线索相关" });
    }

    if (
      app.departure_era &&
      target.departure_era &&
      app.departure_era === target.departure_era
    ) {
      totalScore += 5;
      reasons.push({ field: "era", score: 5, reason: "离乡年代相同" });
    }
  } else {
    if (app.surname && target.surname && app.surname === target.surname) {
      totalScore += 30;
      reasons.push({ field: "surname", score: 30, reason: "姓氏匹配" });
    }

    if (
      app.origin_province &&
      target.province &&
      app.origin_province === target.province
    ) {
      totalScore += 15;
      reasons.push({ field: "province", score: 15, reason: "省份匹配" });
    }

    if (app.origin_city && target.city && app.origin_city === target.city) {
      totalScore += 15;
      reasons.push({ field: "city", score: 15, reason: "城市匹配" });
    }

    if (
      app.origin_district &&
      target.district &&
      app.origin_district === target.district
    ) {
      totalScore += 10;
      reasons.push({ field: "district", score: 10, reason: "区县匹配" });
    }

    if (
      app.village_clue &&
      target.name &&
      (app.village_clue.includes(target.name) ||
        target.name.includes(app.village_clue))
    ) {
      totalScore += 20;
      reasons.push({ field: "village", score: 20, reason: "村落名称匹配" });
    }

    if (
      app.ancestral_hall_clue &&
      target.ancestral_hall_name &&
      (app.ancestral_hall_clue.includes(target.ancestral_hall_name) ||
        target.ancestral_hall_name.includes(app.ancestral_hall_clue))
    ) {
      totalScore += 15;
      reasons.push({ field: "hall", score: 15, reason: "宗祠名称匹配" });
    }
  }

  return { score: Math.min(totalScore, 100), reasons };
}

function calculateVolunteerMatchScore(
  db: ReturnType<typeof getDb>,
  app: any,
  volunteer: any,
): {
  score: number;
  reasons: MatchReason[];
  active_assignments: number;
} {
  const reasons: MatchReason[] = [];
  let totalScore = 0;

  if (
    app.surname &&
    volunteer.surnames &&
    volunteer.surnames.includes(app.surname)
  ) {
    totalScore += 35;
    reasons.push({ field: "surname", score: 35, reason: "熟悉该姓氏" });
  }

  if (
    app.origin_province &&
    volunteer.province &&
    app.origin_province === volunteer.province
  ) {
    totalScore += 20;
    reasons.push({ field: "province", score: 20, reason: "同省志愿者" });
  }

  if (app.origin_city && volunteer.city && app.origin_city === volunteer.city) {
    totalScore += 20;
    reasons.push({ field: "city", score: 20, reason: "同市志愿者" });
  }

  if (
    app.origin_district &&
    volunteer.district &&
    app.origin_district === volunteer.district
  ) {
    totalScore += 10;
    reasons.push({ field: "district", score: 10, reason: "同区县志愿者" });
  }

  if (volunteer.skills && volunteer.skills.length > 0) {
    totalScore += 10;
    reasons.push({ field: "skills", score: 10, reason: "具备查访专长" });
  }

  const assignments = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE volunteer_id = ? AND status IN ('pending', 'investigating')",
    )
    .get(volunteer.id) as any;

  if (assignments.count < 3) {
    totalScore += 5;
    reasons.push({ field: "capacity", score: 5, reason: "工作量适中" });
  }

  return {
    score: Math.min(totalScore, 100),
    reasons,
    active_assignments: assignments.count,
  };
}

router.get("/application/:id/related", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const application = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as any;

  if (!application) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  const otherApplications = db
    .prepare(
      "SELECT * FROM applications WHERE id != ? AND status != ? LIMIT 50",
    )
    .all(id, "broken") as any[];

  const villages = db
    .prepare("SELECT * FROM ancestral_villages")
    .all() as any[];

  const relatedApps = otherApplications
    .map((target) => {
      const { score, reasons } = calculateMatchScore(
        application,
        target,
        "application",
      );
      return {
        ...target,
        match_score: score,
        match_reasons: reasons,
        relation_type:
          application.surname === target.surname ? "同宗申请" : "同乡申请",
      };
    })
    .filter((item) => item.match_score >= 20)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);

  const relatedVillages = villages
    .map((target) => {
      const { score, reasons } = calculateMatchScore(
        application,
        target,
        "village",
      );
      return {
        ...target,
        match_score: score,
        match_reasons: reasons,
        relation_type: "宗祠村落",
      };
    })
    .filter((item) => item.match_score >= 20)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      applications: relatedApps,
      villages: relatedVillages,
    },
  });
});

router.get(
  "/application/:id/recommend-volunteers",
  (req: Request, res: Response) => {
    const db = getDb();
    const { id } = req.params;

    const application = db
      .prepare("SELECT * FROM applications WHERE id = ?")
      .get(id) as any;

    if (!application) {
      return res.status(404).json({ success: false, message: "申请不存在" });
    }

    const volunteers = db
      .prepare("SELECT * FROM volunteers WHERE status = 'active'")
      .all() as any[];

    const scored = volunteers
      .map((v) => {
        const { score, reasons, active_assignments } =
          calculateVolunteerMatchScore(db, application, v);
        return {
          ...v,
          match_score: score,
          match_reasons: reasons,
          active_assignments,
        };
      })
      .sort((a, b) => b.match_score - a.match_score);

    res.json({ success: true, data: scored });
  },
);

router.post("/relations", (req: Request, res: Response) => {
  const db = getDb();
  const {
    source_application_id,
    target_application_id,
    target_village_id,
    relation_type,
    match_score,
    match_reasons,
  } = req.body;

  if (!source_application_id || !relation_type) {
    return res
      .status(400)
      .json({ success: false, message: "源申请ID和关系类型必填" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO clue_relations (
      id, source_application_id, target_application_id, target_village_id,
      relation_type, match_score, match_reasons
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    source_application_id,
    target_application_id || null,
    target_village_id || null,
    relation_type,
    match_score || 0,
    match_reasons ? JSON.stringify(match_reasons) : null,
  );

  res.json({ success: true, data: { id } });
});

router.get("/relations/:applicationId", (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;

  const relations = db
    .prepare(
      `
    SELECT cr.*,
           a_s.applicant_name as source_name,
           a_t.applicant_name as target_name,
           av.name as village_name
    FROM clue_relations cr
    LEFT JOIN applications a_s ON cr.source_application_id = a_s.id
    LEFT JOIN applications a_t ON cr.target_application_id = a_t.id
    LEFT JOIN ancestral_villages av ON cr.target_village_id = av.id
    WHERE cr.source_application_id = ? OR cr.target_application_id = ?
    ORDER BY cr.match_score DESC
  `,
    )
    .all(applicationId, applicationId);

  res.json({ success: true, data: relations });
});

router.delete("/relations/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  db.prepare("DELETE FROM clue_relations WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
