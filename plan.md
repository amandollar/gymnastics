# TAG CRM — Master Project Plan
> **This document is written for an AI coding assistant.** Read it fully before writing a single line of code. Every decision here is intentional. Do not deviate from these directions unless explicitly told to. When in doubt, ask — don't assume.

---

## 0. Project Context

**What this is:** A web-based CRM for The Academy of Gymnastics (TAG), Pune — replacing a manually maintained Excel sheet that's been tracking ~190 gymnastics students.

**Who built it:** Helaph (service provider). The client is TAG, managed by Saif Tamboli.

**Why it matters:** The current Excel (`GYM_TAG_OG.xlsx`) is the source of truth for this CRM. It defines the data model, the workflows, the statuses, and the vocabulary. Before writing any code, understand the Excel.

**Stack:** Next.js 14+ (App Router) · Prisma ORM · PostgreSQL (Neon) · TypeScript · Tailwind CSS · shadcn/ui

**Deployment:** Vercel

**Timeline:** 31 May → 30 June 2026 (hard deadline, LOE signed)

---

## 1. Understanding the Excel (Read This First)

The Excel file has one sheet: `Academy Tracker`. Each row is a student. Here is what every column means:

| Column | Meaning | Notes |
|---|---|---|
| ID No. | Sequential student number (1, 2, 3…) | This is the public-facing student ID, not a UUID |
| Student Name | Full name | |
| Date of birth | Stored as Excel date serial | Convert: `new Date((serial - 25569) * 86400 * 1000)` |
| Age | Computed float (e.g. 6.1) | Don't store — compute from DOB |
| Parents name | Single parent/guardian name | |
| Contact Number | 10-digit Indian mobile | |
| Admission Date | Excel date serial | Date they first joined the academy |
| Student Tenure | e.g. "7 Months" | Duration since admission — don't store, compute |
| Start Date | Excel date serial | Start of current active plan |
| End Date | Excel date serial | End of current active plan (last session date) |
| Session | Total sessions in plan (e.g. 12, 36, 60) | |
| Validity Days | Number of calendar days the plan is valid | |
| Expiry Date | Excel date serial | Start Date + Validity Days |
| Days Left | Expiry Date minus today | Negative = expired. COMPUTE, do not store. |
| Status | Active / Freeze / Inactive / Grace | COMPUTE, do not store. See logic below. |
| Fees | Total fee for current plan in INR | Can vary even for same plan type |
| Ses Complete | Sessions attended so far | |
| Ses Pending | Sessions remaining | COMPUTE: Session - Ses Complete |
| Complete/Incomplete | Whether plan sessions are exhausted | COMPUTE |
| S1–S31 | Individual session attendance dates (Excel serials) or "P" | Each is a date the student attended. "P" = attended but date unknown. |

**Status computation logic (critical):**
```
if sessionsCompleted >= totalSessions → INACTIVE (sessions used up)
else if expiryDate < today → FREEZE (time expired, sessions remain)
else if daysLeft <= 7 → GRACE (about to expire)
else → ACTIVE
```
Status is NEVER stored in the database. Always computed from `sessionsCompleted`, `totalSessions`, and `expiryDate` at query time.

**The S1–S31 attendance columns:** These are NOT 31 fixed slots. They are a spreadsheet hack for storing attendance dates. In the CRM, each S-column value becomes one row in the `attendance` table. Some cells contain "P" (present, date unknown — treat as attended with `date = null` or skip during seed). Some students have fewer than 31 sessions total.

**Key observations from the data:**
- Students on the "same plan" often pay different fee amounts (e.g. multiple students on 36-session plan but fees vary: ₹3200, ₹8000, ₹8640). Fee is per-student, not per-plan-template.
- Some student rows are empty (ID 168, 191–215) — these are blank Excel rows, skip during seed.
- Some DOBs are text strings like "20/09/20" instead of serials — handle both formats in seed.
- Age 126.4 means the DOB cell was empty/corrupt in Excel — treat as null.
- Student tenure "1516 Months" is a corrupt value — treat as null.
- Siblings sometimes share a parent contact number (e.g. students 93/94/95 all have the same parent).

---

## 2. Data Models (Conceptual — Let Prisma Schema Follow This)

These are the entities and their relationships. The AI should derive the Prisma schema from this, not the other way around.

### Users
People who log into the CRM. Three roles: `ADMIN`, `MANAGER`, `TRAINER`.
- Admin invites other users. No self-registration.
- A trainer user may optionally be linked to a Trainer profile.
- Store: id, email, name, hashed password, role, createdAt.

### Students
The core entity. Everything else references students.
- Store: id (cuid), studentNumber (sequential int, unique, user-visible), name, dob, parentName, contactNumber, admissionDate, notes.
- Do NOT store: age, tenure, status, daysLeft, sessionsPending — all computed.
- One student can have multiple plans over time (history), but only one active plan at a time.

### Plans (Templates)
Reusable plan configurations created by Admin.
- Store: id, name (e.g. "Gold - 36 Sessions"), durationMonths, totalSessions, validityDays, defaultFee.
- These are just templates. The actual fee charged to a student lives on the StudentPlan, not here.

### StudentPlans (Plan Instances)
When a student is enrolled in a plan. This is the key join table.
- Store: id, studentId, planId, startDate, endDate (last session target date), expiryDate, totalSessions, sessionsCompleted, fee (actual fee — can differ from plan default), createdAt.
- `isActive` flag: only one plan per student can be active. When a new plan is assigned, the old one becomes inactive.
- Sessions pending = totalSessions - sessionsCompleted (computed).
- Status computed from sessionsCompleted, totalSessions, expiryDate.

### Attendance
One row per session attended.
- Store: id, studentId, studentPlanId, date (nullable — for "P" entries during seed), markedById (user), createdAt.
- Unique constraint on (studentId, date) to prevent double-marking on the same day.
- Marking attendance auto-increments sessionsCompleted on the linked StudentPlan.
- Unmarking decrements it.

### Payments
Manual payment records.
- Store: id, studentId, amount, paidDate, method (CASH / UPI / BANK_TRANSFER / OTHER), notes, recordedById.
- Outstanding balance = studentPlan.fee minus sum(payments for that student's active plan period).

### Trainers
Trainer profiles (separate from user accounts — a trainer may not have login access).
- Store: id, name, phone, email, isActive, assignedStudentIds (or a join table if needed).
- A Trainer can optionally be linked to a User account.

### Messages
Outbound communication log.
- Store: id, subject, body, sentById, recipientType (INDIVIDUAL_STUDENT / ALL_ACTIVE / SPECIFIC_TRAINER / ALL_TRAINERS), recipientId (nullable), sentAt.
- This is a sent-log, not a chat. No replies, no threads.

---

## 3. Auth & Roles

### Implementation
- NextAuth v5 with Credentials provider (email + password).
- Role stored in JWT token — no DB call on every request.
- `middleware.ts` handles route protection based on role from token.
- Passwords hashed with bcrypt.

### Role Permissions Matrix

| Route | Admin | Manager | Trainer |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ❌ |
| Students (view) | ✅ | ✅ | ✅ (own students only) |
| Students (create/edit) | ✅ | ✅ | ❌ |
| Attendance (mark) | ✅ | ✅ | ✅ |
| Attendance (history/reports) | ✅ | ✅ | ✅ (own only) |
| Fees (view) | ✅ | ✅ | ❌ |
| Fees (record payment) | ✅ | ✅ | ❌ |
| Plans (create/edit) | ✅ | ❌ | ❌ |
| Trainers (manage) | ✅ | ✅ | ❌ |
| Messages (send) | ✅ | ✅ | ❌ |
| User management | ✅ | ❌ | ❌ |

---

## 4. Application Structure

```
tag-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx          ← no sidebar, centered card layout
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← sidebar + topbar + role context
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx        ← list with search/filter
│   │   │   ├── new/
│   │   │   │   └── page.tsx    ← enrollment form
│   │   │   └── [id]/
│   │   │       ├── page.tsx    ← student detail
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── attendance/
│   │   │   ├── page.tsx        ← daily marking UI
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   ├── fees/
│   │   │   ├── page.tsx        ← outstanding dues list
│   │   │   └── [studentId]/
│   │   │       └── page.tsx    ← payment history + record payment
│   │   ├── plans/
│   │   │   └── page.tsx        ← plan template CRUD
│   │   ├── trainers/
│   │   │   └── page.tsx
│   │   ├── messages/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx        ← user management (Admin only)
│   │
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts
│       ├── students/
│       │   ├── route.ts        ← GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts    ← GET, PATCH, DELETE
│       ├── attendance/
│       │   └── route.ts        ← GET (by date/student), POST (mark), DELETE (unmark)
│       ├── payments/
│       │   └── route.ts
│       ├── plans/
│       │   └── route.ts
│       ├── messages/
│       │   └── route.ts
│       └── dashboard/
│           └── route.ts        ← aggregated stats endpoint
│
├── components/
│   ├── ui/                     ← shadcn/ui primitives (Button, Card, Badge, etc.)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── RoleGate.tsx        ← conditionally renders children based on role
│   ├── students/
│   │   ├── StudentTable.tsx
│   │   ├── StudentCard.tsx     ← used in attendance marking view
│   │   ├── StudentStatusBadge.tsx
│   │   └── EnrollmentForm.tsx
│   ├── attendance/
│   │   ├── AttendanceGrid.tsx  ← main marking UI (list of student cards for today)
│   │   └── AttendanceHistory.tsx
│   ├── fees/
│   │   ├── DuesTable.tsx
│   │   └── PaymentForm.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ExpiryAlerts.tsx
│   │   └── RevenueChart.tsx
│   └── shared/
│       ├── DatePicker.tsx
│       ├── ConfirmDialog.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── prisma.ts               ← singleton Prisma client
│   ├── auth.ts                 ← NextAuth config
│   ├── utils.ts                ← date helpers, status computation, formatters
│   ├── validations/            ← Zod schemas for all forms
│   │   ├── student.ts
│   │   ├── payment.ts
│   │   └── plan.ts
│   └── services/               ← business logic (not in API routes)
│       ├── students.ts
│       ├── attendance.ts
│       ├── fees.ts
│       └── dashboard.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 ← imports GYM_TAG_OG.xlsx data
│
└── middleware.ts               ← role-based route protection
```

### Architecture Rules (AI must follow these)
1. **API routes are thin.** They parse the request, call a service function, and return the response. Zero business logic inside route handlers.
2. **Business logic lives in `lib/services/`.** Status computation, outstanding balance calculation, session counting — all in services.
3. **Status is never stored.** Computed in `lib/utils.ts → computeStudentStatus()` and called wherever student data is displayed.
4. **No direct Prisma calls in components or pages.** Pages fetch from API routes. API routes call services. Services use Prisma.
5. **Zod validates everything at the API boundary.** No unvalidated data from requests hits the database.

---

## 5. Module Specifications

### Module 1: Auth
**Pages:** `/login`
**Behaviour:**
- Email + password login only. No OAuth, no magic links (can add later).
- On success → redirect to `/dashboard`.
- Failed login → inline error, no toast.
- Session stored as JWT (not database sessions — keeps it stateless).
- Admin can create user accounts from Settings page. Users receive an email with a temp password (or a setup link if email is configured).
- No self-registration endpoint exists.

---

### Module 2: Student Management

**Pages:** `/students`, `/students/new`, `/students/[id]`, `/students/[id]/edit`

**Student List (`/students`):**
- Full-width table (TanStack Table).
- Columns: ID No. · Name · Age · Status · Plan · Sessions Left · Days Left · Fee Outstanding · Actions.
- Search: name, student number, parent name.
- Filters: Status (Active/Freeze/Inactive/Grace), Plan type.
- Status badge is colour-coded: Active=green, Grace=amber, Freeze=blue, Inactive=red.
- Clicking a row → student detail page.
- "Add Student" button → `/students/new`.

**Enrollment Form (`/students/new`):**
- Fields: Name, DOB (date picker), Parent Name, Contact Number, Admission Date.
- Plan section: Select plan template → auto-fills Sessions, Validity Days, Default Fee. Fee field is editable (to allow custom amounts).
- Start Date input → auto-calculates End Date and Expiry Date (shown read-only).
- On submit → creates Student + StudentPlan records.

**Student Detail (`/students/[id]`):**
- Header: Name, ID No., Age, Status badge, DOB, Parent, Contact.
- Current Plan card: Plan name, Start→End dates, Expiry, Sessions completed/total, Progress bar, Days left, Fee, Amount paid, Outstanding balance.
- Attendance history: list of attendance dates (most recent first), total count.
- Payment history: list of payments with date, amount, method.
- Action buttons: Edit Profile, Record Payment, Reassign Plan.

---

### Module 3: Attendance Management

**Pages:** `/attendance`, `/attendance/history`

**Daily Marking (`/attendance`):**
- This is the highest-frequency screen. Optimise for speed and mobile.
- Date selector at top (defaults to today).
- Shows all ACTIVE + GRACE students.
- Each student = a card with: Name, ID, Plan, Sessions left.
- Card has a single "Mark Present" button. When tapped → card turns green, session count updates optimistically.
- If already marked for selected date → show "✓ Attended" state with option to unmark.
- Batch actions: "Mark All" button (rare use but trainers ask for it).
- Marking one attendance:
  1. Creates an `attendance` record (studentId, studentPlanId, date, markedById).
  2. Increments `sessionsCompleted` on the active StudentPlan.
  3. Re-computes student status.
- Unmarking reverses all three.

**History (`/attendance/history`):**
- Filter by student name/ID and date range.
- Shows a table: Date · Student · Marked By · Actions (unmark).
- Per-student attendance summary: total attended / total in plan, percentage.

---

### Module 4: Trainer & Manager Management

**Page:** `/trainers`

**Behaviour:**
- List of trainer profiles with name, contact, active status.
- Create/edit trainer profile (not the same as creating a login user — trainers may just be profiles).
- Assign students to a trainer (optional many-to-many relationship).
- If a trainer also needs login access → go to Settings and create a User with TRAINER role, then link to their Trainer profile.
- Manager accounts managed in Settings (User Management), not here.

---

### Module 5: Fee & Payment Management

**Pages:** `/fees`, `/fees/[studentId]`

**Outstanding Dues List (`/fees`):**
- Table of all students with an outstanding balance > 0.
- Columns: Student · Plan · Total Fee · Amount Paid · Outstanding · Last Payment Date.
- Sortable by outstanding amount (descending default).
- Filter: only show overdue (expiry passed + outstanding > 0).
- Click row → student fee detail.

**Student Fee Detail (`/fees/[studentId]`):**
- Shows plan fee, total paid, outstanding.
- Payment history list: date, amount, method, notes.
- "Record Payment" button → inline form: Amount, Date, Method (Cash/UPI/Bank Transfer/Other), Notes.
- On save → creates Payment record, updates outstanding balance display.
- No payment gateway. Manual recording only (per LOE exclusions).

---

### Module 6: Plan Management

**Page:** `/plans`

**Behaviour:**
- List of plan templates (table): Name · Duration · Sessions · Validity Days · Default Fee · Students on Plan · Actions.
- Create new plan template: Name, Duration (months), Total Sessions, Validity Days, Default Fee (INR).
- Edit plan — changes DO NOT retroactively affect existing StudentPlan instances. Only affects new enrollments.
- Delete plan — only if no students are currently enrolled on it.
- Plans used in enrollment form's dropdown.

**Example plans that mirror the Excel data:**
- 12 Sessions / 36 days / ~₹3,200
- 36 Sessions / 108 days / ~₹8,640
- 60 Sessions / 120 days / ~₹11,880
- Custom (fee override at enrollment handles the variations seen in Excel)

---

### Module 7: Communication System

**Page:** `/messages`

**Behaviour:**
- Compose form: Subject, Body (textarea), Recipient Type dropdown:
  - Individual Student (search by name)
  - All Active Students
  - Specific Trainer (dropdown)
  - All Trainers
- Preview recipient count before sending.
- On send → stores message in DB with sentAt timestamp and recipient details.
- Sent messages log below compose form: Date · Subject · Recipient · Sent By.
- No replies. No inbox. No SMS/WhatsApp (out of scope per LOE).
- Messages are records in the DB — think of this as an announcement log, not a chat system.

---

### Module 8: Dashboard

**Page:** `/dashboard` (home after login for Admin and Manager)

**Layout:** Stats row on top, then two columns (charts left, alerts right).

**Stat Cards (top row):**
- Total Active Students
- Total Freeze Students  
- Revenue This Month (sum of payments in current calendar month)
- Outstanding Dues (sum of all outstanding balances)

**Expiry Alerts (right column — most actionable):**
- Students whose plan expires in the next 7 days → sorted by days left ascending.
- Each row: Name, Days Left, Contact Number (so you can call them directly).
- This is the first thing the admin looks at every morning.

**Charts (left column):**
- Bar chart: Monthly revenue for last 6 months (Recharts).
- Donut chart: Student status breakdown (Active / Freeze / Inactive / Grace).
- Keep it to these two. Don't add more charts.

**Quick Actions:**
- "Mark Attendance" → `/attendance`
- "Add Student" → `/students/new`
- "Record Payment" → `/fees` (or a modal)

---

## 6. Seed Script Logic

The seed script (`prisma/seed.ts`) imports the existing Excel data into the DB. This must run before any UI development.

**Steps:**
1. Parse `GYM_TAG_OG.xlsx` using `xlsx` npm package.
2. Skip rows where Student Name is empty (rows 168, 191–215 in Excel are blank).
3. For each valid student row:
   - Convert date serials: `new Date((serial - 25569) * 86400 * 1000)`
   - Handle text DOBs like "20/09/20" → parse with date-fns `parse('20/09/20', 'dd/MM/yy', new Date())`
   - If Age = 126.4 or DOB is empty/corrupt → set dob = null
   - If Student Tenure = "1516 Months" → set admissionDate = null
   - Create Student record.
4. For each student, create one StudentPlan:
   - Map Session column → totalSessions
   - Map Fees column → fee
   - Map Start Date, End Date, Expiry Date → convert from serial
   - sessionsCompleted = "Ses Complete" column value
5. For each S1–S31 column with a value:
   - If value is a number (serial) → create Attendance record with that date
   - If value is "P" or "p" → skip (date unknown, can't create a valid attendance record)
6. Create one default Admin user (email/password configurable via env).
7. Create a default set of plan templates based on the fee/session patterns seen in the data.

---

## 7. Key Utility Functions (must exist in `lib/utils.ts`)

```
computeStudentStatus(sessionsCompleted, totalSessions, expiryDate): 'ACTIVE' | 'FREEZE' | 'INACTIVE' | 'GRACE'
computeDaysLeft(expiryDate): number  ← can be negative
computeSessionsPending(totalSessions, sessionsCompleted): number
computeOutstandingBalance(planFee, payments[]): number
convertExcelSerial(serial: number): Date
formatINR(amount: number): string  ← "₹8,640"
formatAge(dob: Date): string  ← "6 yrs 3 mo"
```

These functions are the shared brain of the app. Every status badge, every balance display, every days-left counter calls these.

---

## 8. UI/UX Direction

**Design system:** shadcn/ui + Tailwind. Don't reinvent components. Use shadcn's Table, Card, Badge, Dialog, Form, Select, etc.

**Colour palette:**
- Background: white / slate-50
- Primary: a deep blue (e.g. blue-700) — the academy feel, professional
- Status colours: green (Active), amber (Grace), blue (Freeze), red (Inactive)
- Accent: the LOE uses orange for Helaph branding — use sparingly if at all

**Typography:** System font stack is fine. No need for custom fonts on a CRM.

**Mobile-first for:** Attendance marking page only. Everything else is desktop-first (admin/manager uses laptop, trainer uses phone for attendance).

**Loading states:** Use skeleton loaders (shadcn Skeleton) on tables and stat cards — not spinners.

**Error states:** Inline form errors (from React Hook Form). Toast notifications (shadcn Sonner) for success/failure of mutations. Empty state components when tables have no data.

**Confirmation dialogs:** Any destructive action (delete student, unmark attendance, delete plan) must show a confirm dialog before proceeding.

---

## 9. Environment Variables Needed

```
DATABASE_URL          ← Neon PostgreSQL connection string
NEXTAUTH_SECRET       ← Random secret for JWT signing
NEXTAUTH_URL          ← App URL (http://localhost:3000 in dev)
ADMIN_SEED_EMAIL      ← Default admin email for seed script
ADMIN_SEED_PASSWORD   ← Default admin password for seed script
```

---

## 10. What Is Out of Scope (Do Not Build These)

Per the signed LOE between Helaph and TAG:
- Mobile app (iOS/Android)
- Payment gateway (Razorpay, Stripe, etc.)
- SMS integration (Twilio, etc.)
- WhatsApp messaging
- Two-way chat / inbox
- Email delivery for messages (Module 7 is DB-only log, no SMTP required in v1)
- Batch scheduling / class timetable
- Multi-branch / multi-location support
- Student-facing portal or login

If the client asks for any of these during build → that is a Change Request per LOE Section 6. Do not add it to the current build.

---

## 11. Build Sequence (Do This In Order)

1. **Project scaffold** — Next.js, TypeScript, Tailwind, shadcn/ui init, ESLint, Prettier
2. **Database** — Prisma schema, Neon connection, `prisma migrate dev`
3. **Seed script** — Get all 190 students in the DB. Do not proceed to UI until seed works.
4. **Auth** — NextAuth, login page, middleware, role-based redirects
5. **Student list + detail** — The core of the app
6. **Enrollment form** — New student + plan assignment
7. **Plan templates CRUD** — Needed before enrollment works
8. **Attendance marking** — Mobile-optimised, must work on iPhone SE screen size
9. **Attendance history**
10. **Fee overview + payment recording**
11. **Trainer profiles**
12. **Dashboard** — Build last, depends on all other data existing
13. **Messages**
14. **User management (Settings)**
15. **Responsive pass + QA**
16. **Handover docs**

---

## 12. Questions to Ask Before Starting Each Module

Before building any module, confirm:
- What does the user see first on this page?
- What is the single most important action on this page?
- Who is allowed to access this? (check role matrix)
- What happens when there's no data? (empty state)
- What can go wrong and how does the user recover?

---

## 13. Gotchas & Watch-Outs

- **Excel date serials are not timestamps.** They're days since 1 Jan 1900. Use the formula above. Off-by-one errors will put dates in the wrong month.
- **Sessions and days are independent expiry triggers.** A student can run out of sessions while still having days left (INACTIVE), or run out of days while having sessions left (FREEZE). Both need to be handled separately.
- **Fee override at enrollment is not optional.** Multiple students in the Excel are on nominally the same plan but paying different amounts. If the enrollment form doesn't allow fee override, the data model is wrong.
- **Prisma's `@@unique([studentId, date])` on Attendance** — this prevents double-marking but also prevents seeding "P" entries (unknown dates). Handle this gracefully in seed: skip "P" entries rather than failing.
- **Student Number (ID No.) is not auto-increment from Prisma.** It's a business ID that needs to increment sequentially and be user-visible. Use a separate counter or just track the max and increment. Don't expose the cuid to the user.
- **TanStack Table** needs `useMemo` on data and columns to avoid unnecessary re-renders in large student lists.
- **Neon has connection pooling quirks with Prisma.** Use `@prisma/adapter-neon` or ensure connection string uses the pooler endpoint for serverless. Follow Neon's Prisma docs exactly.
- **NextAuth v5 (Auth.js v5) has breaking changes from v4.** If using v5, the config goes in `auth.ts` at root, not in the API route. Follow v5 docs, not v4.