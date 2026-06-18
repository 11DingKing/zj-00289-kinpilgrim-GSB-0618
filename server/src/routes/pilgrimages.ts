import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { status, application_id } = req.query;

  let query = `
    SELECT p.*, a.applicant_name, a.surname, av.name as village_name,
           av.province, av.city, av.district
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== "all") {
    query += " AND p.status = ?";
    params.push(status);
  }
  if (application_id) {
    query += " AND p.application_id = ?";
    params.push(application_id);
  }

  query += " ORDER BY p.created_at DESC";

  const pilgrimages = db.prepare(query).all(...params);
  res.json({ success: true, data: pilgrimages });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const pilgrimage = db
    .prepare(
      `
    SELECT p.*, a.applicant_name, a.surname, a.family_story,
           av.name as village_name, av.province, av.city, av.district,
           av.ancestral_hall_name, av.description as village_description
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.id = ?
  `,
    )
    .get(id) as any;

  if (!pilgrimage) {
    return res.status(404).json({ success: false, message: "祭祖行程不存在" });
  }

  res.json({ success: true, data: pilgrimage });
});

router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const {
    application_id,
    village_id,
    ancestral_hall,
    pilgrimage_date,
    companion_name,
    companion_phone,
  } = req.body;

  if (!application_id || !ancestral_hall || !pilgrimage_date) {
    return res
      .status(400)
      .json({ success: false, message: "申请ID、宗祠名称、祭祖日期必填" });
  }

  const app = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(application_id) as any;
  if (!app) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  if (app.status !== "confirmed") {
    return res
      .status(400)
      .json({ success: false, message: "宗亲确认完成后才能登记祭祖行程" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO pilgrimages (
      id, application_id, village_id, ancestral_hall, pilgrimage_date,
      companion_name, companion_phone, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
  `,
  ).run(
    id,
    application_id,
    village_id || null,
    ancestral_hall,
    pilgrimage_date,
    companion_name || "",
    companion_phone || "",
  );

  db.prepare(
    `
    UPDATE applications 
    SET status = 'confirmed', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(application_id);

  res.json({ success: true, data: { id } });
});

router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const {
    ancestral_hall,
    pilgrimage_date,
    companion_name,
    companion_phone,
    status,
    memories,
    story,
    photos,
  } = req.body;

  const pilgrimage = db
    .prepare("SELECT * FROM pilgrimages WHERE id = ?")
    .get(id) as any;
  if (!pilgrimage) {
    return res.status(404).json({ success: false, message: "祭祖行程不存在" });
  }

  const finalStatus = status || pilgrimage.status;

  db.prepare(
    `
    UPDATE pilgrimages 
    SET ancestral_hall = ?, pilgrimage_date = ?, companion_name = ?, 
        companion_phone = ?, status = ?, memories = ?, story = ?, photos = ?
    WHERE id = ?
  `,
  ).run(
    ancestral_hall || pilgrimage.ancestral_hall,
    pilgrimage_date || pilgrimage.pilgrimage_date,
    companion_name ?? pilgrimage.companion_name,
    companion_phone ?? pilgrimage.companion_phone,
    finalStatus,
    memories ?? pilgrimage.memories,
    story ?? pilgrimage.story,
    photos ?? pilgrimage.photos,
    id,
  );

  if (finalStatus === "completed") {
    db.prepare(
      `
      UPDATE applications 
      SET status = 'completed', updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `,
    ).run(pilgrimage.application_id);
  }

  res.json({ success: true });
});

router.put("/:id/complete", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { memories, story, photos } = req.body;

  const pilgrimage = db
    .prepare("SELECT * FROM pilgrimages WHERE id = ?")
    .get(id) as any;
  if (!pilgrimage) {
    return res.status(404).json({ success: false, message: "祭祖行程不存在" });
  }

  db.prepare(
    `
    UPDATE pilgrimages 
    SET status = 'completed', memories = ?, story = ?, photos = ?
    WHERE id = ?
  `,
  ).run(memories || "", story || "", photos || "", id);

  db.prepare(
    `
    UPDATE applications 
    SET status = 'completed', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(pilgrimage.application_id);

  res.json({ success: true });
});

router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const pilgrimage = db
    .prepare("SELECT * FROM pilgrimages WHERE id = ?")
    .get(id) as any;
  if (!pilgrimage) {
    return res.status(404).json({ success: false, message: "祭祖行程不存在" });
  }

  db.prepare("DELETE FROM pilgrimages WHERE id = ?").run(id);

  db.prepare(
    `
    UPDATE applications 
    SET status = 'investigating', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(pilgrimage.application_id);

  res.json({ success: true });
});

router.put("/:id/toggle-public", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { is_public } = req.body;

  const pilgrimage = db
    .prepare("SELECT * FROM pilgrimages WHERE id = ?")
    .get(id) as any;
  if (!pilgrimage) {
    return res.status(404).json({ success: false, message: "祭祖行程不存在" });
  }

  db.prepare("UPDATE pilgrimages SET is_public = ? WHERE id = ?").run(
    is_public ? 1 : 0,
    id,
  );

  res.json({ success: true });
});

export default router;
