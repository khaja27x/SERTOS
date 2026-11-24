# SERTOS Frontend

This is the frontend copy served or built from inside `backend/`.

For the primary workspace setup, use the top-level `frontend/` directory.

```powershell
cd backend\frontend
Copy-Item .env.example .env
npm install
npm run dev -- --host 127.0.0.1
npm run build
```

Local API:

```text
http://127.0.0.1:8000
```
