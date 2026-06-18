import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { province, city, surname, keyword } = req.query;

  let query = "SELECT * FROM ancestral_villages WHERE 1=1";
  const params: any[] = [];

  if (province) {
    query += " AND province = ?";
    params.push(province);
  }
  if (city) {
    query += " AND city = ?";
    params.push(city);
  }
  if (surname) {
    query += " AND surname LIKE ?";
    params.push(`%${surname}%`);
  }
  if (keyword) {
    query +=
      " AND (name LIKE ? OR ancestral_hall_name LIKE ? OR description LIKE ?)";
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  query += " ORDER BY created_at DESC";

  const villages = db.prepare(query).all(...params);
  res.json({ success: true, data: villages });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const village = db
    .prepare("SELECT * FROM ancestral_villages WHERE id = ?")
    .get(id) as any;

  if (!village) {
    return res.status(404).json({ success: false, message: "宗祠村落不存在" });
  }

  res.json({ success: true, data: village });
});

router.post("/", (req: Request, res: Response) => {
  const db = getDb();
  const {
    name,
    province,
    city,
    district,
    surname,
    ancestral_hall_name,
    description,
  } = req.body;

  if (!name || !province || !city || !surname) {
    return res
      .status(400)
      .json({ success: false, message: "村名、省份、城市、姓氏必填" });
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO ancestral_villages (id, name, province, city, district, surname, ancestral_hall_name, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    name,
    province,
    city,
    district || "",
    surname,
    ancestral_hall_name || "",
    description || "",
  );

  res.json({ success: true, data: { id } });
});

router.put("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const {
    name,
    province,
    city,
    district,
    surname,
    ancestral_hall_name,
    description,
  } = req.body;

  const village = db
    .prepare("SELECT * FROM ancestral_villages WHERE id = ?")
    .get(id) as any;
  if (!village) {
    return res.status(404).json({ success: false, message: "宗祠村落不存在" });
  }

  db.prepare(
    `
    UPDATE ancestral_villages 
    SET name = ?, province = ?, city = ?, district = ?, surname = ?, ancestral_hall_name = ?, description = ?
    WHERE id = ?
  `,
  ).run(
    name || village.name,
    province || village.province,
    city || village.city,
    district ?? village.district,
    surname || village.surname,
    ancestral_hall_name ?? village.ancestral_hall_name,
    description ?? village.description,
    id,
  );

  res.json({ success: true });
});

router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  db.prepare("DELETE FROM ancestral_villages WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
