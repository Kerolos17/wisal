#!/usr/bin/env bash
# Wisal dev-server clean restart. Turbopack in this environment serves stale
# CSS chunks after wisal.css edits, so every stylesheet change needs this.
set -e
PID=$(netstat -ano | grep ":3111" | grep LISTEN | head -1 | awk '{print $5}' || true)
if [ -n "$PID" ]; then taskkill //PID "$PID" //F >/dev/null 2>&1 || true; sleep 1; fi
rm -rf .next 2>/dev/null || true
nohup env PORT=3111 npm run dev > /tmp/wisal-dev.log 2>&1 &
sleep 25
curl -s -o /dev/null -w "server: %{http_code} in %{time_total}s\n" http://localhost:3111 --max-time 240
