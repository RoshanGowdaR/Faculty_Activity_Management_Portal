# Faculty Activity Management Portal

A premium Faculty Activity Management Portal built with React, Node.js, and Supabase. Features a sleek dark UI for lecturers to submit & track academic activities with file uploads, secure JWT auth, SMTP email password resets, and an admin workflow for approvals, verification, audit logs, and bulk ZIP reports.

## Features
- **Sleek Glassmorphic Dark UI**: Premium user interface with smooth animations and theme toggle.
- **Dynamic Submission Forms**: Forms tailored to activity categories (e.g. Research Papers, FDPs).
- **Secure Authentication**: Password hashing with bcrypt, JSON Web Token (JWT) sessions, and secure SMTP-based password resets.
- **Admin Workflow**: Restructured panel for user approvals, verification lockouts, and security audit logs.
- **Supabase Cloud Integration**: Files are streamed directly to Supabase Storage and database records are managed on Supabase PostgreSQL.
- **Bulk Downloads**: Admin can filter submissions and download all attachments compiled on-the-fly in a single ZIP file.
- **Serverless Ready**: Configured for seamless deployment on Vercel.

## Setup & Run

1. Clone this repository.
2. Run `npm install` inside the root, `client/` and `server/` directories.
3. Initialize the Supabase schema by running `server/config/schema.sql` in your Supabase SQL Editor.
4. Configure your `.env` variables in the `server` directory.
5. Launch the application locally by running:
   ```bash
   npm run dev
   ```
