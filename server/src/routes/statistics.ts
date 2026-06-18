import { Router, Request, Response } from "express";
import { getDb } from "../database";

const router = Router();

router.get("/overview", (req: Request, res: Response) => {
  const db = getDb();
  const totalApplications = db
    .prepare("SELECT COUNT(*) as count FROM applications")
    .get() as { count: number };
  const totalVolunteers = db
    .prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'active'")
    .get() as { count: number };
  const totalVillages = db
    .prepare("SELECT COUNT(*) as count FROM ancestral_villages")
    .get() as { count: number };
  const totalPilgrimages = db
    .prepare(
      "SELECT COUNT(*) as count FROM pilgrimages WHERE status = 'completed'",
    )
    .get() as { count: number };

  const pendingCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'pending'",
    )
    .get() as { count: number };
  const investigatingCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'investigating'",
    )
    .get() as { count: number };
  const confirmedCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'confirmed'",
    )
    .get() as { count: number };
  const completedCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'completed'",
    )
    .get() as { count: number };
  const brokenCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'broken'",
    )
    .get() as { count: number };

  const matchedCount =
    totalApplications.count - pendingCount.count - brokenCount.count;
  const matchRate =
    totalApplications.count > 0
      ? Math.round((matchedCount / totalApplications.count) * 100)
      : 0;

  res.json({
    success: true,
    data: {
      totalApplications: totalApplications.count,
      totalVolunteers: totalVolunteers.count,
      totalVillages: totalVillages.count,
      totalPilgrimages: totalPilgrimages.count,
      statusBreakdown: {
        pending: pendingCount.count,
        investigating: investigatingCount.count,
        confirmed: confirmedCount.count,
        completed: completedCount.count,
        broken: brokenCount.count,
      },
      matchRate,
    },
  });
});

router.get("/by-region", (req: Request, res: Response) => {
  const db = getDb();
  const { type = "province" } = req.query;

  let groupField = "origin_province";
  if (type === "city") groupField = "origin_city";
  if (type === "district") groupField = "origin_district";

  const applicationsByRegion = db
    .prepare(
      `
    SELECT 
      ${groupField} as region,
      COUNT(*) as total_count,
      SUM(CASE WHEN status != 'pending' AND status != 'broken' THEN 1 ELSE 0 END) as matched_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM applications
    WHERE ${groupField} IS NOT NULL AND ${groupField} != ''
    GROUP BY ${groupField}
    ORDER BY total_count DESC
  `,
    )
    .all();

  const data = applicationsByRegion.map((item: any) => ({
    region: item.region,
    total: item.total_count,
    matched: item.matched_count,
    completed: item.completed_count,
    matchRate:
      item.total_count > 0
        ? Math.round((item.matched_count / item.total_count) * 100)
        : 0,
    successRate:
      item.total_count > 0
        ? Math.round((item.completed_count / item.total_count) * 100)
        : 0,
  }));

  res.json({ success: true, data });
});

router.get("/by-surname", (req: Request, res: Response) => {
  const db = getDb();
  const data = db
    .prepare(
      `
    SELECT 
      surname,
      COUNT(*) as total_count,
      SUM(CASE WHEN status != 'pending' AND status != 'broken' THEN 1 ELSE 0 END) as matched_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM applications
    WHERE surname IS NOT NULL AND surname != ''
    GROUP BY surname
    ORDER BY total_count DESC
    LIMIT 20
  `,
    )
    .all();

  const result = data.map((item: any) => ({
    surname: item.surname,
    total: item.total_count,
    matched: item.matched_count,
    completed: item.completed_count,
    matchRate:
      item.total_count > 0
        ? Math.round((item.matched_count / item.total_count) * 100)
        : 0,
  }));

  res.json({ success: true, data: result });
});

router.get("/pilgrimages-by-month", (req: Request, res: Response) => {
  const db = getDb();
  const data = db
    .prepare(
      `
    SELECT 
      strftime('%Y-%m', pilgrimage_date) as month,
      COUNT(*) as count
    FROM pilgrimages
    WHERE status = 'completed'
    GROUP BY strftime('%Y-%m', pilgrimage_date)
    ORDER BY month DESC
    LIMIT 12
  `,
    )
    .all();

  res.json({ success: true, data: data.reverse() });
});

router.get("/pilgrimages-by-village", (req: Request, res: Response) => {
  const db = getDb();
  const data = db
    .prepare(
      `
    SELECT 
      av.id as village_id,
      av.name as village_name,
      av.province,
      av.city,
      av.surname,
      COUNT(p.id) as pilgrimage_count
    FROM ancestral_villages av
    LEFT JOIN pilgrimages p ON p.village_id = av.id AND p.status = 'completed'
    GROUP BY av.id
    ORDER BY pilgrimage_count DESC
    LIMIT 10
  `,
    )
    .all();

  res.json({ success: true, data });
});

export default router;
