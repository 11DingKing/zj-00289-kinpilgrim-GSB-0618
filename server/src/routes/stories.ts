import { Router, Request, Response } from "express";
import { getDb } from "../database";

const router = Router();

router.get("/wall", (req: Request, res: Response) => {
  const db = getDb();
  const { province, surname, keyword } = req.query;

  let query = `
    SELECT p.*, a.applicant_name, a.surname, a.family_story,
           av.id as village_id, av.name as village_name,
           av.province, av.city, av.district,
           av.ancestral_hall_name, av.description as village_description
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.status = 'completed' AND p.is_public = 1
  `;
  const params: any[] = [];

  if (province && province !== "all") {
    query += " AND av.province = ?";
    params.push(province);
  }
  if (surname) {
    query += " AND a.surname LIKE ?";
    params.push(`%${surname}%`);
  }
  if (keyword) {
    query +=
      " AND (a.applicant_name LIKE ? OR p.story LIKE ? OR p.memories LIKE ? OR av.name LIKE ?)";
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw);
  }

  query += " ORDER BY p.pilgrimage_date DESC";

  const stories = db.prepare(query).all(...params);
  res.json({ success: true, data: stories });
});

router.get("/by-region", (req: Request, res: Response) => {
  const db = getDb();
  const data = db
    .prepare(
      `
    SELECT 
      av.province,
      av.city,
      COUNT(p.id) as story_count,
      GROUP_CONCAT(DISTINCT a.surname) as surnames
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.status = 'completed' AND p.is_public = 1 AND av.province IS NOT NULL
    GROUP BY av.province, av.city
    ORDER BY story_count DESC
  `,
    )
    .all() as any[];

  const regions: Record<string, any> = {};
  data.forEach((item) => {
    if (!item.province) return;
    if (!regions[item.province]) {
      regions[item.province] = {
        province: item.province,
        total: 0,
        cities: [],
      };
    }
    regions[item.province].total += item.story_count;
    regions[item.province].cities.push({
      city: item.city,
      count: item.story_count,
      surnames: item.surnames ? item.surnames.split(",") : [],
    });
  });

  const result = Object.values(regions).sort(
    (a: any, b: any) => b.total - a.total,
  );
  res.json({ success: true, data: result });
});

router.get("/by-village", (req: Request, res: Response) => {
  const db = getDb();
  const { limit = "20" } = req.query;

  const data = db
    .prepare(
      `
    SELECT 
      av.id as village_id,
      av.name as village_name,
      av.province,
      av.city,
      av.district,
      av.surname,
      av.ancestral_hall_name,
      COUNT(p.id) as pilgrimage_count,
      MAX(p.pilgrimage_date) as latest_pilgrimage
    FROM ancestral_villages av
    LEFT JOIN pilgrimages p ON p.village_id = av.id AND p.status = 'completed' AND p.is_public = 1
    GROUP BY av.id
    HAVING pilgrimage_count > 0
    ORDER BY pilgrimage_count DESC
    LIMIT ?
  `,
    )
    .all(limit);

  res.json({ success: true, data });
});

router.get("/stats", (req: Request, res: Response) => {
  const db = getDb();
  const totalStories = db
    .prepare(
      "SELECT COUNT(*) as count FROM pilgrimages WHERE status = 'completed' AND is_public = 1",
    )
    .get() as { count: number };

  const totalVillages = db
    .prepare(
      `
    SELECT COUNT(DISTINCT village_id) as count 
    FROM pilgrimages 
    WHERE status = 'completed' AND is_public = 1 AND village_id IS NOT NULL
  `,
    )
    .get() as { count: number };

  const totalSurnames = db
    .prepare(
      `
    SELECT COUNT(DISTINCT a.surname) as count
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    WHERE p.status = 'completed' AND p.is_public = 1 AND a.surname IS NOT NULL
  `,
    )
    .get() as { count: number };

  const monthlyTrend = db
    .prepare(
      `
    SELECT 
      strftime('%Y-%m', pilgrimage_date) as month,
      COUNT(*) as count
    FROM pilgrimages
    WHERE status = 'completed' AND is_public = 1
    GROUP BY strftime('%Y-%m', pilgrimage_date)
    ORDER BY month DESC
    LIMIT 12
  `,
    )
    .all();

  res.json({
    success: true,
    data: {
      totalStories: totalStories.count,
      totalVillages: totalVillages.count,
      totalSurnames: totalSurnames.count,
      monthlyTrend: monthlyTrend.reverse(),
    },
  });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const story = db
    .prepare(
      `
    SELECT p.*, a.applicant_name, a.applicant_phone, a.surname,
           a.origin_province, a.origin_city, a.origin_district,
           a.village_clue, a.ancestral_hall_clue, a.family_story,
           a.known_ancestors, a.departure_era,
           av.id as village_id, av.name as village_name,
           av.province, av.city, av.district,
           av.ancestral_hall_name, av.description as village_description
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.id = ? AND p.status = 'completed' AND p.is_public = 1
  `,
    )
    .get(id) as any;

  if (!story) {
    return res
      .status(404)
      .json({ success: false, message: "故事不存在或未公开" });
  }

  const relatedStories = db
    .prepare(
      `
    SELECT p.*, a.applicant_name, a.surname, av.name as village_name
    FROM pilgrimages p
    LEFT JOIN applications a ON p.application_id = a.id
    LEFT JOIN ancestral_villages av ON p.village_id = av.id
    WHERE p.status = 'completed' AND p.is_public = 1 AND p.id != ?
      AND (av.id = ? OR a.surname = ?)
    ORDER BY p.pilgrimage_date DESC
    LIMIT 5
  `,
    )
    .all(id, story.village_id, story.surname);

  res.json({ success: true, data: { ...story, relatedStories } });
});

export default router;
