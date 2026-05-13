import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "2h",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID || "",
    appSecret: process.env.WECHAT_APP_SECRET || "",
    mchId: process.env.WECHAT_MCH_ID || "",
    apiKeyV3: process.env.WECHAT_API_KEY_V3 || "",
    privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH || "",
    serialNo: process.env.WECHAT_SERIAL_NO || "",
  },

  cos: {
    secretId: process.env.COS_SECRET_ID || "",
    secretKey: process.env.COS_SECRET_KEY || "",
    bucket: process.env.COS_BUCKET || "",
    region: process.env.COS_REGION || "ap-guangzhou",
  },

  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || "10485760", 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
};
