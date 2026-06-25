# Supabase Migration & Vercel Deployment Walkthrough

We have successfully integrated the **Supabase** keys into your environment configuration and fully prepared the project for local development and **Vercel** serverless cloud deployment.

---

## 🛠️ Updated Tech Stack & Key Files Implemented

### 1. Credentials Configuration
- **File**: [server/.env](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/.env)
- **Status**: Updated with the Supabase API URL, Publishable Key (`SUPABASE_ANON_KEY`), and Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) that you provided.

### 2. Compatibility & Routing Modifications
- **Backend (Express)**: Added a recursive JSON response mapper in [server.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/server.js) that automatically injects `_id` alongside standard SQL `id` columns. This preserves compatibility with the MongoDB-designed React pages without having to edit dozens of front-end components.
- **Frontend (Vite/React)**: Added a global Axios request interceptor in [main.jsx](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/client/src/main.jsx) to dynamically rewrite the hardcoded `http://localhost:5000` endpoints to relative paths (or custom server host `VITE_API_URL`). This makes the frontend fully compatible with Vercel serverless deployments.
- **Evidence Downloads**: Modified download links in [LecturerDashboard.jsx](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/client/src/pages/LecturerDashboard.jsx) and [AdminDashboard.jsx](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/client/src/pages/AdminDashboard.jsx) to support public Supabase storage bucket links directly instead of prefixing them with the local Express port.
- **Integration Tests**: Updated [api.test.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/test/api.test.js) to support both `id` and `_id` identifiers during automated test assertions.

---

## 🚀 Execution Steps Required on Supabase Dashboard

Since Supabase database schema manipulation (creating tables, custom constraints) is restricted to direct SQL console inputs, please complete these two quick setups in your Supabase project dashboard:

### Step 1: Run the Database Schema DDL
1. Open your Supabase Dashboard: [https://supabase.com](https://supabase.com)
2. Select your project: `loqawcpaiixmfalstdgy`
3. Click on the **SQL Editor** tab on the left-hand navigation sidebar.
4. Click **New Query** -> **Blank Query**.
5. Copy the entire DDL script from [schema.sql](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/config/schema.sql) and paste it into the editor.
6. Click **Run** to execute. This will create all the required PostgreSQL tables and pre-populate the master data lists (Departments, Designations, Categories).

### Step 2: Create a Public Storage Bucket for Proofs
1. Click on the **Storage** tab on the left-hand navigation sidebar of your Supabase dashboard.
2. Click **New Bucket**.
3. Set the name to exactly `proofs`.
4. Ensure the **Public** bucket toggle is enabled (so uploaded documents can be downloaded securely via public URLs).
5. Click **Create Bucket**.

Once these two steps are complete, the background Express dev server will automatically connect to your database, seed the admin account (`gowdaroshan49@gmail.com` / `OnePiece@#6362`), and boot successfully!

---

## ⚡ Running & Verifying the Application Locally

1. **Start the Dev Servers**:
   The concurrent server is already running in your workspace console. You can inspect it or start it manually with:
   ```bash
   npm run dev
   ```
2. **Verify Server Boot**:
   Observe the server logs. Once tables are created, you will see:
   `Seeded default admin account: gowdaroshan49@gmail.com / OnePiece@#6362`
3. **Execute Integration Tests**:
   Open a separate shell inside the workspace directory and execute:
   ```bash
   npm run test
   ```
   This will clean up previous test records and confirm standard Lecturer registration, Pending status lockouts, and Admin approvals.

---

## ☁️ Vercel Deployment Guide

To deploy the application to Vercel:

1. **Deploy to Vercel**:
   Run the vercel deployment from your terminal or connect your GitHub repository to Vercel.
   ```bash
   vercel
   ```
2. **Add Environment Variables**:
   In your Vercel Project Settings under **Environment Variables**, add the keys from your `server/.env` file:
   - `JWT_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_SECURE`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
