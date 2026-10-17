@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call pnpm install
)
set AGENTCONFIG_PORT=20130
node src\server.js
