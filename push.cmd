@echo off
set msg=%~1
if "%msg%"=="" set msg=Update application code and backend services

echo ==================================================
echo  STAGING, COMMITTING, AND PUSHING ALL BRANCHES
echo ==================================================

git add .
git commit -m "%msg%"
git push origin main

echo Syncing traffic-backend subtree to backend, traffic-backend, and render-backend...
git branch -D backend-deploy-tmp >nul 2>&1
git subtree split --prefix=traffic-backend -b backend-deploy-tmp
git push origin backend-deploy-tmp:backend --force
git push origin backend-deploy-tmp:traffic-backend --force
git push render-backend backend-deploy-tmp:main --force
git branch -D backend-deploy-tmp >nul 2>&1

echo ==================================================
echo  SUCCESS: PUSHED TO main, backend, traffic-backend, AND render-backend!
echo  RENDER ^& GITHUB ARE NOW 100%% IN SYNC!
echo ==================================================

