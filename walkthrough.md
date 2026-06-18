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
  - **Segmented Pill Selector**: Replaced the full-width status dropdown select with a row of beautiful, interactive, pill-shaped radio buttons. When selected, the buttons highlight with their respective theme colors (Blue, Amber, Purple, Emerald, Zinc) and subtle drop shadow rings, while unselected ones show a clean border and zoom on hover.
  - **Color Bug Fix**: Corrected non-standard Tailwind values (`bg-zinc-650`, `border-zinc-650`, `hover:text-zinc-650`, `dark:bg-zinc-955`, and `dark:hover:bg-zinc-805`) to valid Tailwind colors (`bg-zinc-600`, `border-zinc-600`, `hover:text-zinc-600`, `dark:bg-zinc-950`, and `dark:hover:bg-zinc-800`), resolving the issue where the "Lost" selection background rendered white/transparent.
  - **Layout Aesthetics**: Corrected remaining Tailwind color typos: changed `text-zinc-350` to `text-zinc-400` (to fix black close icon visibility) and `placeholder-zinc-550` to `placeholder-zinc-500` (for clear placeholder visibility). Removed double-darkening gradients from the scanner camera overlays to ensure consistent contrast.
  - **Scan Feedback Alert Overlay**:
    - Constrained the scan message overlay (success present mark UI and failure error message) to `max-w-xs` and centered it horizontally using `left-1/2 -translate-x-1/2` to prevent stretching.
    - Increased vertical padding to `p-5` (giving it taller stature), removed borders completely (`border-0`), and used clean glassmorphism.
    - Added a red warning cross (`X`) icon on failure scan feedback, while keeping the checkmark (`Check`) on success.
  - **Attendance Success Audio & Toast Notification**:
    - Plays `/audio/atttendance-success.mp3` at full volume (`volume = 1.0`) on a successful check-in.
    - Displays a glassmorphic check-in notification card in the bottom-right corner of the screen containing a custom green checkmark, the student's name, and their updated session completion stats (e.g. `Sessions: 12 / 24`) clearly.
    - Automatically hides after 2.5 seconds or immediately when the next check-in is initiated.

---

## Verification and Testing

### Automated Build Check
We ran a production compilation of the Next.js app to verify types, component layouts, and routing:
```bash
npm run build
```
- **Result**: Compiled successfully in 3.9s. TypeScript types verified. All 14 static and dynamic routes compiled without errors.
