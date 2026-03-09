# Deploy Birdie Backend to Railway

Follow these steps to deploy your backend so others can use the app with your shared server.

---

## 1. Push your code to GitHub

Make sure your Birdie project is pushed to GitHub (e.g. `tylerjung1206/Birdie`).

---

## 2. Create a Railway account

1. Go to [railway.app](https://railway.app)
2. Sign up (free) — use **Login with GitHub**

---

## 3. Create a new project

1. Click **New Project**
2. Choose **Deploy from GitHub repo**
3. Select your **Birdie** repository
4. Authorize Railway if prompted

---

## 4. Set the root directory

Your backend lives in the `backend/` folder. Railway needs to know:

1. Click on the service that was created
2. Go to **Settings**
3. Find **Root Directory** (under "Build" or "Source")
4. Enter: `backend`
5. Click outside to save

---

## 5. Add environment variables

1. In your service, go to **Variables** (or **Variables** tab)
2. Click **+ New Variable** or **Add Variable**
3. Add:

| Name         | Value                                                                 |
|--------------|-----------------------------------------------------------------------|
| `JWT_SECRET` | A long random string (e.g. `k9x2mP7qR4vL1nJ8wY3bN6hF0cT5sA`)          |

**Important:** Use a strong, random secret. Don't share it.

**Optional — make yourself admin after first signup:**

| Name                    | Value        |
|-------------------------|--------------|
| `BIRDIE_ADMIN_USERNAME` | Your username (e.g. `tyler`) |

If you set this, after you register in the app, **redeploy** the service (Settings → Redeploy) so you become admin.

---

## 6. (Optional) Persistent database storage

By default, SQLite data is lost when Railway redeploys. To keep it:

1. Go to **Settings** → **Volumes**
2. Click **Add Volume**
3. Set mount path to `/data`
4. In **Variables**, add:

| Name        | Value             |
|-------------|-------------------|
| `BIRDIE_DB` | `/data/birdie.db` |

---

## 7. Generate a public URL

1. Go to **Settings** → **Networking** (or the **Networking** tab)
2. Click **Generate Domain**
3. Railway will assign a URL like `https://birdie-api-production-xxxx.up.railway.app`
4. Copy this URL — this is your backend URL

---

## 8. Deploy

Railway deploys automatically when you connect the repo. If it hasn’t started:

1. Click **Deploy** or push a new commit
2. Wait for the build to finish (green checkmark)

---

## 9. Test it

1. Open your Birdie app
2. Enter your Railway URL in the **Server URL** field (e.g. `https://birdie-api-production-xxxx.up.railway.app`)
3. Register a new account
4. If you set `BIRDIE_ADMIN_USERNAME`, redeploy once, then log out and log back in — you should see the Admin tab

---

## 10. Share with others

Give them:

1. The **DMG** (Mac) or **exe** (Windows) installer
2. Your **backend URL**

They enter the URL in the **Server URL** field on the login screen and register.

---

## Troubleshooting

**Build fails**
- Confirm **Root Directory** is set to `backend`
- Check the build logs for errors

**"Cannot connect to the server"**
- Confirm the URL has no trailing slash
- Use `https://` (Railway provides HTTPS)

**Data disappears after redeploy**
- Add a Volume and set `BIRDIE_DB=/data/birdie.db` (see step 6)
