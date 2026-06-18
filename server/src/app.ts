import express from "express";
import cors from "cors";
import { initDatabase } from "./database";
import applicationsRouter from "./routes/applications";
import volunteersRouter from "./routes/volunteers";
import villagesRouter from "./routes/villages";
import pilgrimagesRouter from "./routes/pilgrimages";
import statisticsRouter from "./routes/statistics";
import kinshipRouter from "./routes/kinship";
import matchingRouter from "./routes/matching";
import storiesRouter from "./routes/stories";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/applications", applicationsRouter);
  app.use("/api/volunteers", volunteersRouter);
  app.use("/api/villages", villagesRouter);
  app.use("/api/pilgrimages", pilgrimagesRouter);
  app.use("/api/statistics", statisticsRouter);
  app.use("/api/kinship", kinshipRouter);
  app.use("/api/matching", matchingRouter);
  app.use("/api/stories", storiesRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "寻根祭祖平台服务运行中" });
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: "服务器内部错误" });
    },
  );

  initDatabase();

  return app;
}
