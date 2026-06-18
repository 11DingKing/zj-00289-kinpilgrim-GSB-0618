import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { application_id, village_id, surname } = req.query;

  let query = `
    SELECT k.*, a.applicant_name, av.name as village_name,
           av.province, av.city, av.district
    FROM kinship_archives k
    LEFT JOIN applications a ON k.application_id = a.id
    LEFT JOIN ancestral_villages av ON k.village_id = av.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (application_id) {
    query += " AND k.application_id = ?";
    params.push(application_id);
  }
  if (village_id) {
    query += " AND k.village_id = ?";
    params.push(village_id);
  }
  if (surname) {
    query += " AND k.confirmed_surname LIKE ?";
    params.push(`%${surname}%`);
  }

  query += " ORDER BY k.created_at DESC";

  const archives = db.prepare(query).all(...params);
  res.json({ success: true, data: archives });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const archive = db
    .prepare(
      `
    SELECT k.*, a.applicant_name, a.applicant_phone, a.family_story,
           av.name as village_name, av.province, av.city, av.district,
           av.ancestral_hall_name, av.description as village_description
    FROM kinship_archives k
    LEFT JOIN applications a ON k.application_id = a.id
    LEFT JOIN ancestral_villages av ON k.village_id = av.id
    WHERE k.id = ?
  `,
    )
    .get(id) as any;

  if (!archive) {
    return res.status(404).json({ success: false, message: "认亲档案不存在" });
  }

  res.json({ success: true, data: archive });
});

router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const {
    application_id,
    village_id,
    confirmed_surname,
    relationship_type,
    ancestor_name,
    generation_level,
    confirmation_basis,
    dna_verified,
    archive_notes,
    confirmer_name,
  } = req.body;

  if (!application_id || !confirmed_surname) {
    return res
      .status(400)
      .json({ success: false, message: "申请ID和确认姓氏必填" });
  }

  const app = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(application_id) as any;
  if (!app) {
    return res.status(404).json({ success: false, message: "申请不存在" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO kinship_archives (
      id, application_id, village_id, confirmed_surname, relationship_type,
      ancestor_name, generation_level, confirmation_basis, dna_verified,
      archive_notes, confirmer_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    application_id,
    village_id || null,
    confirmed_surname,
    relationship_type || "",
    ancestor_name || "",
    generation_level || null,
    confirmation_basis || "",
    dna_verified ? 1 : 0,
    archive_notes || "",
    confirmer_name || "",
  );

  db.prepare(
    `
    UPDATE applications 
    SET status = 'confirmed', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(application_id);

  db.prepare(
    `
    UPDATE investigation_steps 
    SET status = 'completed', result = ?, notes = ?, updated_at = datetime('now', 'localtime')
    WHERE application_id = ? AND step_index = 2
  `,
  ).run(
    confirmation_basis || "宗亲确认完成",
    archive_notes || "已通过宗亲确认",
    application_id,
  );

  res.json({ success: true, data: { id } });
});

router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const {
    village_id,
    confirmed_surname,
    relationship_type,
    ancestor_name,
    generation_level,
    confirmation_basis,
    dna_verified,
    archive_notes,
    confirmer_name,
  } = req.body;

  const archive = db
    .prepare("SELECT * FROM kinship_archives WHERE id = ?")
    .get(id) as any;
  if (!archive) {
    return res.status(404).json({ success: false, message: "认亲档案不存在" });
  }

  db.prepare(
    `
    UPDATE kinship_archives 
    SET village_id = ?, confirmed_surname = ?, relationship_type = ?,
        ancestor_name = ?, generation_level = ?, confirmation_basis = ?,
        dna_verified = ?, archive_notes = ?, confirmer_name = ?,
        confirmed_at = datetime('now', 'localtime')
    WHERE id = ?
  `,
  ).run(
    village_id ?? archive.village_id,
    confirmed_surname || archive.confirmed_surname,
    relationship_type ?? archive.relationship_type,
    ancestor_name ?? archive.ancestor_name,
    generation_level ?? archive.generation_level,
    confirmation_basis ?? archive.confirmation_basis,
    dna_verified !== undefined ? (dna_verified ? 1 : 0) : archive.dna_verified,
    archive_notes ?? archive.archive_notes,
    confirmer_name ?? archive.confirmer_name,
    id,
  );

  res.json({ success: true });
});

router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const archive = db
    .prepare("SELECT * FROM kinship_archives WHERE id = ?")
    .get(id) as any;
  if (!archive) {
    return res.status(404).json({ success: false, message: "认亲档案不存在" });
  }

  db.prepare("DELETE FROM kinship_archives WHERE id = ?").run(id);

  res.json({ success: true });
});

router.get("/by-village/:villageId", (req: Request, res: Response) => {
  const db = getDb();
  const { villageId } = req.params;

  const archives = db
    .prepare(
      `
    SELECT k.*, a.applicant_name
    FROM kinship_archives k
    LEFT JOIN applications a ON k.application_id = a.id
    WHERE k.village_id = ?
    ORDER BY k.created_at DESC
  `,
    )
    .all(villageId);

  res.json({ success: true, data: archives });
});

export default router;
