import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { status, surname, keyword } = req.query;

  let query = "SELECT * FROM volunteers WHERE 1=1";
  const params: any[] = [];

  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }
  if (surname) {
    query += " AND surnames LIKE ?";
    params.push(`%${surname}%`);
  }
  if (keyword) {
    query += " AND (name LIKE ? OR skills LIKE ? OR city LIKE ?)";
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  query += " ORDER BY created_at DESC";

  const volunteers = db.prepare(query).all(...params);
  res.json({ success: true, data: volunteers });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const volunteer = db
    .prepare("SELECT * FROM volunteers WHERE id = ?")
    .get(id) as any;

  if (!volunteer) {
    return res.status(404).json({ success: false, message: "志愿者不存在" });
  }

  const assignments = db
    .prepare(
      `
    SELECT a.*, COUNT(p.id) as pilgrimage_count
    FROM applications a
    LEFT JOIN pilgrimages p ON p.application_id = a.id
    WHERE a.volunteer_id = ?
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `,
    )
    .all(id);

  res.json({ success: true, data: { ...volunteer, assignments } });
});

router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const { name, phone, province, city, district, surnames, skills } = req.body;

  if (!name || !province || !city) {
    return res.status(400).json({ success: false, message: "姓名和地区必填" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO volunteers (id, name, phone, province, city, district, surnames, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    name,
    phone || "",
    province,
    city,
    district || "",
    surnames || "",
    skills || "",
  );

  res.json({ success: true, data: { id } });
});

router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { name, phone, province, city, district, surnames, skills, status } =
    req.body;

  const volunteer = db
    .prepare("SELECT * FROM volunteers WHERE id = ?")
    .get(id) as any;
  if (!volunteer) {
    return res.status(404).json({ success: false, message: "志愿者不存在" });
  }

  db.prepare(
    `
    UPDATE volunteers 
    SET name = ?, phone = ?, province = ?, city = ?, district = ?, surnames = ?, skills = ?, status = ?
    WHERE id = ?
  `,
  ).run(
    name || volunteer.name,
    phone ?? volunteer.phone,
    province || volunteer.province,
    city || volunteer.city,
    district ?? volunteer.district,
    surnames ?? volunteer.surnames,
    skills ?? volunteer.skills,
    status || volunteer.status,
    id,
  );

  res.json({ success: true });
});

router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const hasAssignments = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE volunteer_id = ?",
    )
    .get(id) as { count: number };

  if (hasAssignments.count > 0) {
    return res
      .status(400)
      .json({ success: false, message: "该志愿者有在办任务，无法删除" });
  }

  db.prepare("DELETE FROM volunteers WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
