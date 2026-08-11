# Project Rules for Traffic Branch Record Management

## Deployment & Git Push Protocol
Whenever pushing changes to GitHub/Render, ALWAYS push to BOTH the `main` branch and the backend subtree branches (`backend` & `traffic-backend`) to ensure Render auto-redeployments trigger seamlessly:

Use either:
- Command line: `git push-all`
- Batch script: `.\push.cmd "commit message"`
- NPM script: `npm run push-all`
