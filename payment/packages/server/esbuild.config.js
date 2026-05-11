const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  format: "cjs",
  sourcemap: true,
  external: [
    "bcryptjs",
    "sharp",
    "@prisma/client",
    "prisma",
    "jsonwebtoken",
    "exceljs",
    "multer",
    "cos-nodejs-sdk-v5",
    "wechatpay-node-v3",
    "pino",
    "pino-pretty",
    "express",
    "cors",
    "cookie-parser",
    "dotenv",
    "zod",
    "@sms/shared",
    "fs",
    "path",
  ],
  // Don't bundle the prisma schema and migrations
  loader: { ".node": "copy" },
}).then(() => {
  console.log("Server build complete -> dist/index.js");
}).catch(() => process.exit(1));
