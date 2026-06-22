# Academy of Gymnastics (TAG) CRM

A premium, production-ready, full-featured Customer Relationship Management (CRM) and Student Management platform designed specifically for gymnastics academies. Built using **Next.js (App Router)**, **React**, **PostgreSQL**, **Prisma ORM**, and **NextAuth**.

---

## 🌟 Key Features

### 1. Student Admission & Profile Management
*   **Structured Admission**: Track student information, gender, date of birth, student levels (Beginner, Foundation 1–3, National 4–7), medical history, and general notes.
*   **Registration Fees**: Input one-time registration fees during admission.
*   **Printable Admission Receipts**: Instantly generate clean, printable A4 admission receipts immediately after student creation.
*   **Student Profile View**: A unified student dashboard displaying plan history, visual attendance logs, payments, levels progress, and login credentials.

### 2. Membership Plans & Scheduling
*   **Flexible Memberships**: Configure Group (Regular) and Personal (1-to-1) training plans with custom start/end dates, duration months, and sessions per week.
*   **Dynamic Scheduling**: Assign students to specific class days (e.g. Monday, Wednesday, Friday) and select batches.
*   **Plan Freezing**: Freeze memberships for vacation or injury with automatic plan period extensions.
*   **Grace Periods**: Intelligent, rule-based grace periods before plans expire or shift to inactive.

### 3. Visual Attendance Tracker
*   **Dynamic Multi-Month Calendar**: Interactive month-by-month calendar grids depicting attended classes (color-coded by session number), scheduled days, holidays, and frozen dates.
*   **Staff Interface**: Mark attendance quickly as Present or Absent for all students in a batch.
*   **Attendance Logs**: Audit history of marked sessions.

### 4. Billing, Payments & Receipts
*   **Invoice Management**: Auto-generating invoices containing detailed price-per-class calculations, applied discounts, paid amounts, and outstanding dues.
*   **Multiple Payment Methods**: Supports UPI, Cash, Bank Transfer, and others.
*   **Printable Invoices**: Styled exactly for A4 printing, containing business branding, active signature, and notes.

### 5. Employee & Coach Management
*   **Role Classification**: Track employees as Coaches/Trainers or facility Staff.
*   **PT Commission Splits**: Custom, editable Personal Training share percentages per coach (e.g. 50%, 60% split) for training revenue share.
*   **Fixed Salary**: Track monthly fixed salaries.
*   **Salary Payouts**: Monthly salary worksheet calculating absent day deductions, PT earnings, and total payout with a Paid/Unpaid status toggle.
*   **Attendance Tracker**: Daily present/absent logs for academy personnel.

### 6. Leads & Enquiries Pipeline
*   **Pipeline Statuses**: Manage leads through stages: `NEW`, `CONTACTED`, `FOLLOW_UP`, `CONVERTED`, or `LOST`.
*   **Conversion Flow**: One-click convert an enquiry into a student profile, pulling lead data (parent name, child age, contact details) directly into the admission form.

### 7. Parent Portal
*   **Exclusive Parent View**: Parents log in securely using credentials to view their child's dashboard.
*   **Overview & Progress**: View remaining sessions, current plan duration, class timings, and coach details.
*   **Portal Receipts**: Parents can print and download payment invoices and admission receipts directly from the billing tab.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 15 (App Router with Server Actions)
*   **Runtime/Language**: Node.js & TypeScript
*   **Styling**: Vanilla CSS & Tailwind CSS
*   **Authentication**: NextAuth.js (Credentials Provider)
*   **ORM**: Prisma Client
*   **Database**: PostgreSQL (hosted on Neon)
*   **Icons**: Lucide React
*   **Image Storage**: Cloudinary (for employee/student avatars)

---

## ⚡ Performance & Production Architecture

The application has been heavily optimized to ensure instantaneous page loads and resilience under serverless runtime conditions:
*   **Prisma Client Singleton**: Client instantiation is cached globally to prevent multiple TCP/TLS handshakes and database connection pool exhaustion.
*   **pgPool Cache**: Caches the native node-postgres connection pool on the global scope to ensure reusable database socket connections.
*   **Request-Scoped Session Caching**: Wraps NextAuth's `auth()` call in a React `cache()` wrapper (`getSessionUser()`), deduplicating session verification queries across layouts and nested route components.
*   **Skeleton Screens**: Customized skeleton loaders are rendered for zero layout-shift (CLS) transitions during high-latency database fetches.

---

## 🚀 Setup & Installation

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and configure the following variables:
```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
NEXTAUTH_SECRET="your-randomly-generated-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Seeding configurations
ADMIN_SEED_EMAIL="admin@academyofgymnastics.com"
ADMIN_SEED_PASSWORD="AdminSecurePassword123!"

# Cloudinary (Optional, for avatar uploading)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Synchronize Database & Generate Prisma Client
Push the schema to your PostgreSQL database, generate the TypeScript client, and seed initial users:
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma Client classes
npx prisma generate

# Seed initial admin, manager, and trainer accounts
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 👥 Default Accounts (Seeded)

Once seeded, you can log in using these default credentials:

| Role | Email | Default Password | Dashboard Access |
| :--- | :--- | :--- | :--- |
| **Admin** | *From `ADMIN_SEED_EMAIL`* | *From `ADMIN_SEED_PASSWORD`* | Full access, settings & management |
| **Manager** | `manager@academyofgymnast.com` | `ManagerPassword123!` | Management, billing & profiles |
| **Trainer** | `trainer@academyofgymnast.com` | `TrainerPassword123!` | Mark student attendance, view schedules |
