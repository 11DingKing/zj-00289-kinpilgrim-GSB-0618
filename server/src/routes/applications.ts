import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const stepNames = ["线索梳理", "实地探访", "宗亲确认"];

interface Application {
  id: string;
  applicant_name: string;
  applicant_phone: string;
  surname: string;
  origin_province: string;
  origin_city: string;
  origin_district: string;
  village_clue: string;
  ancestral_hall_clue: string;
  departure_era: string;
  generation_count: number;
  known_ancestors: string;
  family_story: string;
  status: string;
  volunteer_id: string | null;
  current_step: number;
  created_at: string;
  updated_at: string;
}

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { status, surname, keyword } = req.query;

  let query =
    "SELECT a.*, v.name as volunteer_name FROM applications a LEFT JOIN volunteers v ON a.volunteer_id = v.id WHERE 1=1";
  const params: any[] = [];

  if (status && status !== "all") {
    query += " AND a.status = ?";
    params.push(status);
  }
  if (surname) {
    query += " AND a.surname LIKE ?";
    params.push(`%${surname}%`);
  }
  if (keyword) {
    query +=
      " AND (a.applicant_name LIKE ? OR a.village_clue LIKE ? OR a.family_story LIKE ?)";
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  query += " ORDER BY a.created_at DESC";

  const applications = db.prepare(query).all(...params);
  res.json({ success: true, data: applications });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const application = db
    .prepare(
      `
    SELECT a.*, v.name as volunteer_name, v.phone as volunteer_phone
    FROM applications a 
    LEFT JOIN volunteers v ON a.volunteer_id = v.id 
    WHERE a.id = ?
  `,
    )
    .get(id) as Application | undefined;

  if (!application) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  const steps = db
    .prepare(
      `
    SELECT * FROM investigation_steps 
    WHERE application_id = ? 
    ORDER BY step_index ASC
  `,
    )
    .all(id);

  const pilgrimage = db
    .prepare(
      `
    SELECT p.*, av.name as village_name, av.province, av.city, av.district
    FROM pilgrimages p
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.application_id = ?
    LIMIT 1
  `,
    )
    .get(id) as any;
  res.json({
    success: true,
    data: {
      ...application,
      steps,
      pilgrimage: pilgrimage || null,
    },
  });
});

router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const {
    applicant_name,
    applicant_phone,
    surname,
    origin_province,
    origin_city,
    origin_district,
    village_clue,
    ancestral_hall_clue,
    departure_era,
    generation_count,
    known_ancestors,
    family_story,
  } = req.body;

  if (!applicant_name || !surname) {
    return res
      .status(400)
      .json({ success: false, message: "申请人姓名和姓氏必填" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO applications (
      id, applicant_name, applicant_phone, surname, origin_province, origin_city, origin_district,
      village_clue, ancestral_hall_clue, departure_era, generation_count, known_ancestors,
      family_story, status, current_step
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
  `,
  ).run(
    id,
    applicant_name,
    applicant_phone || "",
    surname,
    origin_province || "",
    origin_city || "",
    origin_district || "",
    village_clue || "",
    ancestral_hall_clue || "",
    departure_era || "",
    generation_count || 0,
    known_ancestors || "",
    family_story || "",
  );

  const insertStep = db.prepare(`
    INSERT INTO investigation_steps (id, application_id, step_index, step_name, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  const tx = db.transaction(() => {
    for (let i = 0; i < stepNames.length; i++) {
      insertStep.run(uuidv4(), id, i, stepNames[i]);
    }
  });
  tx();

  res.json({ success: true, data: { id } });
});

router.put("/:id/status", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { status, step_index, step_result, step_notes } = req.body;

  const app = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as any;
  if (!app) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  if (app.status === "broken") {
    return res
      .status(400)
      .json({ success: false, message: "申请已标记线索中断，无法继续推进" });
  }

  if (status) {
    db.prepare(
      `UPDATE applications SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    ).run(status, id);
  }

  if (step_index !== undefined) {
    const step = db
      .prepare(
        "SELECT * FROM investigation_steps WHERE application_id = ? AND step_index = ?",
      )
      .get(id, step_index) as any;

    if (step) {
      db.prepare(
        `
        UPDATE investigation_steps 
        SET status = ?, result = ?, notes = ?, updated_at = datetime('now', 'localtime')
        WHERE application_id = ? AND step_index = ?
      `,
      ).run(
        step_result ? "completed" : "in_progress",
        step_result || null,
        step_notes || null,
        id,
        step_index,
      );

      if (step_result) {
        const nextStep = step_index + 1;
        if (nextStep < stepNames.length) {
          db.prepare(
            `
            UPDATE investigation_steps 
            SET status = 'in_progress', updated_at = datetime('now', 'localtime')
            WHERE application_id = ? AND step_index = ?
          `,
          ).run(id, nextStep);
        }
        db.prepare("UPDATE applications SET current_step = ? WHERE id = ?").run(
          Math.min(nextStep, stepNames.length - 1),
          id,
        );
      }
    }
  }

  res.json({ success: true });
});

router.put("/:id/match", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { volunteer_id } = req.body;

  if (!volunteer_id) {
    return res.status(400).json({ success: false, message: "请选择志愿者" });
  }

  const app = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as any;
  if (!app) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  if (app.volunteer_id) {
    return res
      .status(400)
      .json({ success: false, message: "该申请已匹配志愿者，不能重复匹配" });
  }

  const volunteer = db
    .prepare("SELECT * FROM volunteers WHERE id = ?")
    .get(volunteer_id) as any;
  if (!volunteer) {
    return res.status(400).json({ success: false, message: "志愿者不存在" });
  }

  db.prepare(
    `
    UPDATE applications 
    SET volunteer_id = ?, status = 'investigating', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(volunteer_id, id);

  db.prepare(
    `
    UPDATE investigation_steps 
    SET status = 'in_progress', updated_at = datetime('now', 'localtime')
    WHERE application_id = ? AND step_index = 0
  `,
  ).run(id);

  res.json({ success: true });
});

router.get("/:id/steps", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const steps = db
    .prepare(
      `
    SELECT * FROM investigation_steps 
    WHERE application_id = ? 
    ORDER BY step_index ASC
  `,
    )
    .all(id);

  res.json({ success: true, data: steps });
});

router.get("/:id/kinship", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const archives = db
    .prepare(
      `
    SELECT k.*, av.name as village_name, av.province, av.city, av.district,
           av.ancestral_hall_name
    FROM kinship_archives k
    LEFT JOIN ancestral_villages av ON k.village_id = av.id
    WHERE k.application_id = ?
    ORDER BY k.created_at DESC
  `,
    )
    .all(id);

  res.json({ success: true, data: archives });
});

router.get("/:id/related-clues", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const application = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as any;

  if (!application) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  const relatedApps = db
    .prepare(
      `
    SELECT a.*,
      CASE WHEN a.surname = ? THEN 30 ELSE 0 END
      + CASE WHEN a.origin_province = ? THEN 15 ELSE 0 END
      + CASE WHEN a.origin_city = ? THEN 15 ELSE 0 END
      + CASE WHEN a.origin_district = ? THEN 10 ELSE 0 END
      as match_score
    FROM applications a
    WHERE a.id != ? AND a.status != 'broken'
    HAVING match_score >= 15
    ORDER BY match_score DESC
    LIMIT 10
  `,
    )
    .all(
      application.surname,
      application.origin_province,
      application.origin_city,
      application.origin_district,
      id,
    );

  const relatedVillages = db
    .prepare(
      `
    SELECT av.*,
      CASE WHEN av.surname = ? THEN 30 ELSE 0 END
      + CASE WHEN av.province = ? THEN 15 ELSE 0 END
      + CASE WHEN av.city = ? THEN 15 ELSE 0 END
      + CASE WHEN av.district = ? THEN 10 ELSE 0 END
      as match_score
    FROM ancestral_villages av
    HAVING match_score >= 15
    ORDER BY match_score DESC
    LIMIT 5
  `,
    )
    .all(
      application.surname,
      application.origin_province,
      application.origin_city,
      application.origin_district,
    );

  res.json({
    success: true,
    data: {
      applications: relatedApps,
      villages: relatedVillages,
    },
  });
});

export default router;
