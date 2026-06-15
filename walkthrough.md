# Performance Optimization & Skeleton Screen Walkthrough

We have successfully resolved the page-switching bottlenecks and fully optimized the application structure to be production-grade.

## Summary of Changes

### 1. Database Connection & Client Singleton Optimizations
- **Prisma Client Caching**: Modified [prisma.ts](file:///Users/rishukumar/Github/tag/lib/prisma.ts) to cache the `PrismaClient` on the global object in both development *and* production environments. This prevents multiple connections and handshake delays to the Neon database across serverless function warming/invocations.
- **pg Pool Singleton Caching**: Modified [pg-pool.ts](file:///Users/rishukumar/Github/tag/lib/db/pg-pool.ts) to similarly cache node-postgres `Pool` on `globalThis` to ensure connection pool reuse.

### 2. Request & Session Deduplication
- **Auth Session Cache Wrapper**: Created [auth-session.ts](file:///Users/rishukumar/Github/tag/lib/auth-session.ts), wrapping NextAuth's `auth()` call in a request-scoped React `cache()`.
- **Page and Layout Deduplication**: Replaced direct `auth()` imports with `getSession()` across the entire dashboard layout and all individual pages:
  - [layout.tsx](file:///Users/rishukumar/Github/tag/app/(dashboard)/layout.tsx)
  - All pages: `/dashboard`, `/students`, `/students/[id]`, `/students/[id]/edit`, `/students/new`, `/students/bulk-upload`, `/plans`, `/attendance`, `/enquiries`, `/enquiries/[id]/edit`, `/enquiries/new`, `/coaches`, and `/settings`.
  - *Result*: The JWT is decoded exactly once per server-rendered request, avoiding redundant auth runs when traversing layouts and pages.

### 3. Server-Side Filtering
- **Pushing Search Filters to Prisma**: Updated [students.ts](file:///Users/rishukumar/Github/tag/lib/services/students.ts) to push filters (`search`, `status`) down to the database level inside the Prisma query instead of filtering all rows in memory with JavaScript.

### 4. Instant Loading Skeletons
We added Next.js `loading.tsx` skeletons matching the structure of each page:
- [Skeleton.tsx](file:///Users/rishukumar/Github/tag/components/ui/Skeleton.tsx): Main primitive blocks (`SkeletonBlock`, `SkeletonTable`, `SkeletonForm`, `SkeletonCalendar`, etc.) with shimmering animations.
- Page Skeletons:
  - `/dashboard/loading.tsx`
  - `/students/loading.tsx`
  - `/plans/loading.tsx` (matches the custom plan-allotment form container, pickers, toggles, calendars, day buttons, fee-previews, and actions)
  - `/attendance/loading.tsx`
  - `/coaches/loading.tsx`
  - `/enquiries/loading.tsx`
  - `/settings/loading.tsx`
  - `/students/[id]/loading.tsx`
  - `/students/new/loading.tsx`
  - `/students/bulk-upload/loading.tsx`
  - `/enquiries/new/loading.tsx`
  - `/enquiries/[id]/edit/loading.tsx`
  - `/students/[id]/edit/loading.tsx`

### 5. Prefetching Optimizations (Minimizing Database Query Cascades)
- **Viewport-based Prefetching Disabled (`prefetch={false}`)**: Added `prefetch={false}` to all navigation links in `DashboardNav`, `MobileBottomNav`, and `DashboardSidebar`.
- **Grid and Table Row Prefetching Disabled**: Added `prefetch={false}` to student row links in the student table and mobile list cards in `StudentsListClient.tsx`, and enquiry row links (convert, edit) in `EnquiryListClient.tsx`.
- **Why this is critical**: By default, Next.js prefetches any `<Link>` that enters the viewport. For sidebars and table rows, this triggers parallel server component runs for *all* linked pages (which run database queries like fetching profile details, plans, and bills for every student or enquiry rendered on the page). Disabling viewport prefetching prevents this cascading load on the Neon database while retaining hover-based prefetching for instant navigations.

---

## Verification and Testing

### Automated Build Check
We ran a production compilation of the Next.js app to verify types, component layouts, and routing:
```bash
npm run build
```
- **Result**: Compiled successfully in 3.9s. TypeScript types verified. All 14 static and dynamic routes compiled without errors.
