# Academy of Gymnastics (TAG) CRM

Next.js app with NextAuth credentials login, Prisma + PostgreSQL, and role-based dashboard access.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.local` and set:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=YourPassword123!
```

3. Push schema and seed users:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Default seed accounts

| Role    | Email                          | Password              |
|---------|--------------------------------|-----------------------|
| Admin   | from `ADMIN_SEED_EMAIL`        | from env              |
| Manager | manager@academyofgymnast.com   | ManagerPassword123!   |
| Trainer | trainer@academyofgymnast.com   | TrainerPassword123!   |
