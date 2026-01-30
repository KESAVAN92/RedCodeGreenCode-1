# Deployment Guide: RedCode GreenCode

## Frontend (Vercel) ✅ Ready
The frontend is configured to deploy on Vercel with static builds.

### Deploy Frontend to Vercel:
```bash
git add .
git commit -m "Add vercel.json and env config for deployment"
git push origin main
```

Then in Vercel Dashboard:
1. Import your GitHub repo
2. Vercel will auto-detect the build settings
3. Add environment variable in Vercel Settings → Environment Variables:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://redcode-backend.onrender.com` (will update after backend deploy)

---

## Backend (Render.com) 🚀 Ready to Deploy

### Option 1: Deploy Using render.yaml (Recommended)

1. **Push code to GitHub**:
   ```bash
   git add render.yaml server/
   git commit -m "Add Render deployment config"
   git push
   ```

2. **Go to [render.com](https://render.com)**:
   - Sign up / Log in
   - Click **+ New** → **Web Service**
   - Connect your GitHub repo
   - Select the repo
   - In the **Build Command** field, use:
     ```
     cd server && npm install
     ```
   - In the **Start Command** field, use:
     ```
     node index.js
     ```

3. **Add Environment Variables** (in Render dashboard):
   ```
   PORT = 5000
   MONGODB_URI = mongodb+srv://VasuJoe:VasuJoe1985@database.kzth2m0.mongodb.net/redcode?retryWrites=true&w=majority
   APPLICATION_URL = https://redcode-greencode.vercel.app
   NODE_ENV = production
   ```

4. **Deploy** → Wait ~2 minutes for build to complete
5. **Copy the Render URL** (e.g., `https://redcode-backend.onrender.com`)

### Option 2: Manual Deploy on Render

1. Go to [render.com](https://render.com) → **+ New** → **Web Service**
2. Connect GitHub repo
3. **Name**: `redcode-backend`
4. **Environment**: Node
5. **Build Command**: `cd server && npm install`
6. **Start Command**: `node index.js`
7. **Plan**: Free (or Starter if you need consistency)
8. Add the environment variables above
9. Deploy

---

## Final Steps

### 1. Update Vercel Frontend with Backend URL
Once Render deploy completes:
1. Go to Vercel Project → Settings → Environment Variables
2. Update `VITE_API_URL` with your Render backend URL
3. Redeploy frontend (push a commit or click "Redeploy")

### 2. Test the Deployment
```bash
# Local testing (both running)
npm run dev          # Frontend at localhost:5173
cd server && npm start  # Backend at localhost:5000

# Production testing
# Visit: https://redcode-greencode.vercel.app
# Should connect to https://redcode-backend.onrender.com
```

### 3. Free Tier Notes
- **Vercel**: Free tier includes 100 GB bandwidth/month
- **Render**: Free tier spins down after 15 mins inactivity (starts up on request)
  - To keep backend always running, upgrade to Starter ($7/month)
  - Or use [Koyeb](https://www.koyeb.com) (free with auto-sleep) or [Railway](https://railway.app)

---

## Troubleshooting

**404 errors on /api routes?**
- Check that `VITE_API_URL` in Vercel matches your Render backend URL exactly

**Socket.IO connection fails?**
- Ensure backend is running on Render
- Check CORS in [server/index.js](server/index.js) includes your Vercel URL
- Check browser console for CORS errors

**MongoDB connection error?**
- Verify `MONGODB_URI` is correct in Render environment variables
- Check IP whitelist in MongoDB Atlas (should allow all: 0.0.0.0/0)

---

## Config Files Created
- [vercel.json](vercel.json) - Vercel static build config
- [.env.local](.env.local) - Local dev (uses localhost:5000)
- [.env.production](.env.production) - Production (uses Render URL)
- [render.yaml](render.yaml) - Render blueprint (optional, can also deploy manually)

---

## Environment Variables Reference

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000         # Dev
VITE_API_URL=https://redcode-backend.onrender.com  # Prod
```

### Backend (Render)
```
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-atlas-connection-string>
APPLICATION_URL=https://redcode-greencode.vercel.app
```
