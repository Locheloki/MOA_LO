@echo off
title MOA ^& Legal Opinion Tracking System
echo Starting MOA ^& Legal Opinion Tracking System...
cd /d "C:\MOA_LO-main\MOA_LO-main"
start chrome "http://localhost:5000"
call npm run dev
pause
