// 覆盖 Express query 类型 — 简化 query 参数为 string
declare module "express-serve-static-core" {
  interface Request {
    query: Record<string, string | undefined>;
  }
}

export {};
