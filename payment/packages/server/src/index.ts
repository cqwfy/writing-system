import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pino from "pino";
import { config } from "./config";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./routes/auth.routes";
import { studentRouter } from "./routes/student.routes";
import { classRouter } from "./routes/class.routes";
import { courseRouter } from "./routes/course.routes";
import { timetableRouter } from "./routes/timetable.routes";
import { attendanceRouter } from "./routes/attendance.routes";
import { gradeRouter } from "./routes/grade.routes";
import { noticeRouter } from "./routes/notice.routes";
import { feeRouter } from "./routes/fee.routes";
import { dormitoryRouter } from "./routes/dormitory.routes";
import { rewardRouter } from "./routes/reward.routes";
import { teacherRouter } from "./routes/teacher.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import path from "path";

const logger = pino({
  transport: config.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
});

export async function createApp() {
  const app = express();

  // 基础中间件
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 请求日志
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, "request");
    next();
  });

  // 路由
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/students", studentRouter);
  app.use("/api/v1/classes", classRouter);
  app.use("/api/v1/courses", courseRouter);
  app.use("/api/v1/timetables", timetableRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/grades", gradeRouter);
  app.use("/api/v1/notices", noticeRouter);
  app.use("/api/v1/fees", feeRouter);
  app.use("/api/v1/dormitories", dormitoryRouter);
  app.use("/api/v1/rewards", rewardRouter);
app.use("/api/v1/teachers", teacherRouter);
  app.use("/api/v1/dashboard", dashboardRouter);

  // 静态文件（上传的图片）
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  // 健康检查
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 生产模式：托管管理后台静态文件（SPA 回退）
  if (config.nodeEnv === "production") {
    const adminDist = path.resolve(__dirname, "../../admin/dist");
    app.use(express.static(adminDist));
    app.get(/^(?!\/api\/)/, (_req, res) => {
      res.sendFile(path.join(adminDist, "index.html"));
    });
  }

  // 全局错误处理
  app.use(errorHandler);

  return app;
}

// 启动
if (require.main === module || process.env.NODE_ENV !== "test") {
  createApp().then((app) => {
    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
    });
  });
}
