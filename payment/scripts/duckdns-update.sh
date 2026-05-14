#!/bin/bash
# DuckDNS 自动更新脚本 — 每 5 分钟通过 crontab 执行
# 部署方式：
#   1. scp 此文件到服务器: scp scripts/duckdns-update.sh root@8.160.165.176:/usr/local/bin/
#   2. chmod +x /usr/local/bin/duckdns-update.sh
#   3. crontab -e 添加: */5 * * * * /usr/local/bin/duckdns-update.sh >> /var/log/duckdns.log 2>&1

TOKEN="ca6e8e30-0d93-4ef2-b2b1-ca5611d4ff93"
DOMAIN="school31415"
LOG_TAG="[duckdns-update]"

RESULT=$(curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&verbose=true")
echo "$(date '+%Y-%m-%d %H:%M:%S') ${LOG_TAG} ${RESULT}"
