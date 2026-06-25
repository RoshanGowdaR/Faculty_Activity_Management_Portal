# Implementation Plan - Supabase Database Migration & Vercel Cloud Deployment

This plan details the migration of the database layer from MongoDB to Supabase (PostgreSQL), moving file storage from the local disk to a Supabase Storage bucket, and configuring the project for a unified deployment to Vercel.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Credentials**:
> You will need to create a project on the [Supabase Dashboard](https://supabase.com/). Once created, you must supply the following environment variables in Vercel or your local `.env` file:
> - `SUPABASE_URL`: Your Supabase Project URL.
> - `SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
> - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role API key (needed on the server to bypass Row Level Security for administrative queries).
> 
> **Database Table Initialization**:
> We will provide a SQL script `server/config/schema.sql` containing all table declarations. You must run this script in the **SQL Editor** of your Supabase Dashboard to create the tables.
>
> **Supabase Storage Bucket**:
> You must create a public storage bucket named `proofs` in your Supabase project for certificate and document uploads.

---

## Proposed Changes

### 1. Database Layer: MongoDB/Mongoose ➔ Supabase/PostgreSQL
We will replace `mongoose` in our Express backend with `@supabase/supabase-js`. 
- Data types such as activity descriptions and dynamic category details will be stored in a `jsonb` column in PostgreSQL, maintaining the flexible schema structure for different activity categories.
- User passwords will continue to be securely hashed via `bcryptjs` and verified on our backend.

#### PostgreSQL Table Layout (`schema.sql`)
1. **`departments`**: `id` (uuid/serial), `name` (text, unique)
2. **`designations`**: `id` (uuid/serial), `name` (text, unique)
3. **`categories`**: `id` (uuid/serial), `name` (text, unique)
4. **`users`**:
   - `id` (uuid, default gen_random_uuid())
   - `name` (text)
   - `email` (text, unique)
   - `password_hash` (text)
   - `employee_id` (text, unique)
   - `department` (text)
   - `designation` (text)
   - `role` (text: 'lecturer' | 'admin')
   - `status` (text: 'pending' | 'approved' | 'rejected')
   - `created_at` (timestamp)
5. **`submissions`**:
   - `id` (uuid)
   - `user_id` (uuid, references users)
   - `category` (text)
   - `title` (text)
   - `academic_year` (text)
   - `file_path` (text) - URL pointing to the file in Supabase Storage
   - `detail_fields` (jsonb) - holds flexible fields per category
   - `status` (text: 'pending' | 'verified' | 'rejected')
   - `submitted_at` (timestamp)
6. **`notifications`**: `id` (uuid), `user_id` (uuid, references users), `message` (text), `is_read` (boolean), `created_at` (timestamp)
7. **`audit_logs`**: `id` (uuid), `user_id` (uuid, references users, nullable), `action` (text), `target` (text), `timestamp` (timestamp)

---

### 2. File Storage Layer: Local Disk ➔ Supabase Storage
We will modify the file upload middleware:
- Instead of using Multer's `diskStorage` which writes to local disk (which is read-only and ephemeral on Vercel serverless containers), we will configure Multer to use `memoryStorage`.
- When a file is uploaded, the backend will stream the buffer directly to the `proofs` bucket in Supabase Storage and store the public retrieval URL in the database.

---

### 3. Deployment Configuration: Local Concurrently ➔ Vercel
To deploy both the React frontend and Express backend in a single Vercel project, we will configure Vercel routing:
- **Frontend Build**: Built by Vite and outputted as static assets.
- **Backend API**: The Express server will be routed to Vercel Serverless Functions.

#### [NEW] [vercel.json](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/vercel.json)
We will define routing rules:
- `/api/*` requests will be routed to `server/server.js`.
- All other requests will serve the static React frontend from `client/dist`.

---

## Component Modifications

### [Component Name: Backend Configurations]

#### [MODIFY] [db.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/config/db.js)
- Replace Mongoose connection with the initialization of the Supabase Client.

#### [NEW] [schema.sql](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/config/schema.sql)
- SQL script containing the PostgreSQL DDL statements for your Supabase SQL Editor.

#### [MODIFY] [uploadMiddleware.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/middleware/uploadMiddleware.js)
- Change to memory storage and export the file upload validator.

#### [MODIFY] [authController.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/controllers/authController.js)
- Rewrite Mongoose queries to use `supabase.from('users')` queries.

#### [MODIFY] [submissionController.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/controllers/submissionController.js)
- Rewrite Mongoose queries to Supabase syntax and handle uploads to the `proofs` bucket.

#### [MODIFY] [adminController.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/controllers/adminController.js)
- Update registration approvals and audit logging queries.

#### [MODIFY] [masterController.js](file:///c:/Users/gowda/OneDrive/Desktop/Faculty_Management/server/controllers/masterController.js)
- Adapt setup lists management to Postgres syntax.

---

## Verification Plan

### Automated Verification
We will update our test file `server/test/api.test.js` to run against the Supabase database instance to verify:
1. Registration & approvals flow.
2. Token-scoped API access control checks.

### Manual Verification
1. Run local Vite/Express development environment using the Supabase cloud connection to ensure database records and files write to Supabase.
2. Validate Vercel deployment logs and try logging in.
