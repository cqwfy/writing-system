#!/bin/bash
set -e

echo "=== 学生管理系统 部署脚本 ==="
echo ""

# 配置（修改为你自己的服务器信息）
SERVER_HOST="${SERVER_HOST:-your-server-ip}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PATH="${SERVER_PATH:-/srv/sms}"

echo "部署目标: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

# 1. 本地构建
echo ""
echo "[1/5] 构建 shared 包..."
pnpm --filter shared build

echo "[2/5] 构建管理后台..."
pnpm --filter admin build

echo "[3/5] 构建服务端..."
cd packages/server
npx prisma generate --schema=src/prisma/schema.prisma
pnpm build
cd ../..

# 2. 上传到服务器
echo ""
echo "[4/5] 上传文件到服务器..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}/server ${SERVER_PATH}/admin/dist"
rsync -avz --delete \
  packages/server/dist/ \
  packages/server/package.json \
  packages/server/package-lock.json \
  packages/server/ecosystem.config.js \
  packages/server/src/prisma/ \
  ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/server/

rsync -avz --delete \
  packages/admin/dist/ \
  ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/admin/dist/

# 3. 服务器上安装依赖和迁移
echo ""
echo "[5/5] 服务器上安装依赖并启动..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
  cd /srv/sms/server

  # 安装依赖
  npm install --production

  # 生成 Prisma Client
  npx prisma generate --schema=src/prisma/schema.prisma

  # 运行迁移
  npx prisma migrate deploy --schema=src/prisma/schema.prisma

  # 创建日志目录
  mkdir -p /srv/sms/logs

  # 重启服务
  pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
  pm2 save
ENDSSH

echo ""
echo "=== 部署完成 ==="
echo ""
echo "检查服务状态: ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 status'"
echo "查看日志:      ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 logs sms-api'"
