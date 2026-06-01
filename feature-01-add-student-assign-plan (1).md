# Feature 01 — Add Student & Assign Plan
**Academy CRM · First Feature Spec**

---

## Overview

This is a two-step flow:
1. **Add Student** — capture personal/contact info (no plan yet)
2. **Assign Plan** — attach a plan to the student, which computes all session/fee/status fields

A student can exist without a plan (enquiry → enrolled state). A plan is always linked to a student.

---

## Data Models

### Student
```ts
Student {
  id              : number        // auto-increment
  name            : string        // required
  dateOfBirth     : Date          // required
  age             : number        // computed (see logic)
  parentsName     : string        // required
  contactNumber   : string        // required, 10 digits
  admissionDate   : Date          // required, default = today
  tenure          : string        // computed (see logic)
  plan            : Plan | null   // null until assigned
}
```

### Plan
```ts
Plan {
  studentId       : number
  type            : "regular" | "1to1"
  startDate       : Date          // user input
  endDate         : Date          // user input (date picker)
  sessionsPerWeek : number        // 1–6, derived from selectedDays
  selectedDays    : string[]      // e.g. ["Monday","Wednesday","Friday"]
  discountPercent : number        // default 0

  // --- computed on save ---
  totalSessions   : number        // count of matching weekdays between startDate & endDate
  validityDays    : number        // grace buffer (computed)
  expiryDate      : Date          // startDate + validityDays
  daysLeft        : number        // validityDays - daysSinceStart (live)
  fees            : number        // finalPrice after discount
  pricePerSession : number        // from pricing table
  planMonths      : 1 | 3 | null  // derived from date range
  status          : "Active" | "Grace" | "Inactive" | "Freeze"  // live computed

  // --- attendance ---
  sessions        : Date[]        // list of attended session dates (S1–S62), max 62
  sessionsComplete: number        // sessions.length
  sessionsPending : number        // totalSessions - sessionsComplete
  completion      : "Complete" | "Incomplete"
}
```

---

## Step 1 — Add Student Form

### Fields

| Field | Type | Validation |
|---|---|---|
| Student Name | text | required |
| Date of Birth | date picker | required, must be in past |
| Parent's Name | text | required |
| Contact Number | tel | required, 10 digits, numeric only |
| Admission Date | date picker | required, default = today |

### Computed on Save (no user input needed)

```ts
// Age — shows as e.g. 11.3 (years + months/10)
age = differenceInYears(today, dateOfBirth)
    + differenceInMonths(today, dateOfBirth) % 12 / 10

// Tenure — recalculated live whenever viewed
tenure = differenceInMonths(today, admissionDate) + " Months"
```

### UX Notes
- After saving, offer two options: **"Assign Plan Now"** or **"Do It Later"**
- Student without plan shows a "No Plan" badge in the student list

---

## Step 2 — Assign Plan Form

### Fields (user inputs)

| Field | Type | Notes |
|---|---|---|
| Plan Type | toggle | `Regular` or `1-to-1` |
| Start Date | date picker | required |
| End Date | date picker | required, must be after Start Date |
| Days of Week | multi-checkbox | Mon–Sun; count of checked = S/W |
| Discount % | number input | optional, 0–100, default 0 |

> `Sessions per Week` is **not** a direct input — it is the count of checked days.

### Computed Fields (derive automatically, show as preview before saving)

#### `totalSessions`
Count every occurrence of the selected weekdays between startDate and endDate (inclusive).

```ts
function countSessions(startDate, endDate, selectedDays): number {
  let count = 0
  let current = new Date(startDate)
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  while (current <= endDate) {
    if (selectedDays.includes(dayNames[current.getDay()])) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}
```

#### `pricePerSession`

```ts
const regularPricing = { 1: 400, 2: 325, 3: 267, 4: 245, 5: 220, 6: 208 }
const oneToOnePricing = { 1: 1100, 2: 1000, 3: 900, 4: 850, 5: 800, 6: 750 }

pricePerSession = (type === "regular" ? regularPricing : oneToOnePricing)[sessionsPerWeek]
```

#### `fees` (final price after discount)
```ts
grossFees  = round(totalSessions * pricePerSession)
fees       = grossFees - (grossFees * discountPercent / 100)
```

#### `validityDays` (grace buffer)
```ts
// Grace factor depends on sessions per week
function graceFactor(spw: number): number {
  if (spw === 2) return 4
  if (spw === 3 || spw === 4) return 6
  if (spw >= 5) return 8
  return 0  // 1 session/week = no grace
}

const planWeeks = round((endDate - startDate) / 86400000 / 30)  // approx months as weeks
validityDays = planWeeks * graceFactor(sessionsPerWeek)
```

#### `expiryDate`
```ts
expiryDate = addDays(startDate, validityDays)
```

#### `daysLeft` (live — recalculate whenever displayed)
```ts
daysLeft = validityDays - differenceInDays(today, startDate)
```

#### `status` (live — recalculate whenever displayed)
```ts
function getStatus(endDate, daysLeft): string {
  if (!endDate) return ""
  if (today <= endDate)  return "Active"
  if (daysLeft > 0)      return "Grace"
  if (daysLeft > -30)    return "Inactive"
  return "Freeze"
}
```

#### `planMonths` (for revenue calculations)
```ts
const diffDays = differenceInDays(endDate, startDate)
planMonths = diffDays <= 31 ? 1 : diffDays <= 93 ? 3 : null
```

#### `sessionsComplete`, `sessionsPending`, `completion`
```ts
sessionsComplete = sessions.length           // attendance array
sessionsPending  = totalSessions - sessionsComplete
completion       = sessionsComplete >= totalSessions ? "Complete" : "Incomplete"
```

---

## Fee Preview Component

Show this live preview block as the user fills the Assign Plan form:

```
┌─────────────────────────────────┐
│  Sessions/Week     3            │
│  Total Sessions    48           │
│  Price/Session     ₹267         │
│  Gross Fees        ₹12,816      │
│  Discount          10%          │
│  Final Price       ₹11,534      │
│  Grace Days        18           │
│  Expiry Date       12 Oct 2026  │
└─────────────────────────────────┘
```

Update this block on every field change (reactive).

---

## Status Badge Colors

| Status | Color |
|---|---|
| Active | Green |
| Grace | Yellow/Amber |
| Inactive | Orange |
| Freeze | Red |
| No Plan | Grey |

---

## Summary Stats (Dashboard / Student List Header)

```ts
totalStudents    = students.length
activeStudents   = students.filter(s => ["Active","Grace"].includes(s.plan?.status)).length
inactiveStudents = students.filter(s => s.plan?.status === "Inactive").length
frozenStudents   = students.filter(s => s.plan?.status === "Freeze").length
noPlanStudents   = students.filter(s => !s.plan).length
```

---

## API Endpoints (suggested REST)

```
POST   /students              → create student (no plan)
GET    /students              → list all students
GET    /students/:id          → get single student with plan
PUT    /students/:id          → update student info

POST   /students/:id/plan     → assign plan to student
PUT    /students/:id/plan     → update existing plan
DELETE /students/:id/plan     → remove plan

POST   /students/:id/attendance  → mark a session attended (adds date to sessions[])
```

---

## Field Summary — Quick Reference

| Field | Source | Formula / Notes |
|---|---|---|
| `age` | computed | `DATEDIF(dob, today, "Y") + DATEDIF(dob, today, "YM")/10` |
| `tenure` | computed | `DATEDIF(admissionDate, today, "M") + " Months"` |
| `endDate` | user input | date picker (or `EDATE(startDate, months)`) |
| `totalSessions` | computed | count weekday occurrences in range |
| `validityDays` | computed | `round(rangeDays/30) × graceFactor(spw)` |
| `expiryDate` | computed | `startDate + validityDays` |
| `daysLeft` | live | `validityDays - daysSinceStart` |
| `status` | live | Active → Grace → Inactive → Freeze |
| `pricePerSession` | lookup | pricing table by type + spw |
| `fees` | computed | `round(totalSessions × pps) × (1 - discount/100)` |
| `sessionsComplete` | count | `sessions[].length` |
| `sessionsPending` | computed | `totalSessions - sessionsComplete` |
| `completion` | computed | `sessionsComplete >= totalSessions` |
| `planMonths` | computed | `1` if ≤31d, `3` if ≤93d, else `null` |

---

## Flow Diagram

```
[Enquiry] 
    ↓ 
[Add Student] → Student saved (no plan, status = grey)
    ↓
[Assign Plan] → Plan saved, all fields computed
    ↓
[Mark Attendance] → sessions[] grows, sessionsComplete updates
    ↓
[Status auto-updates] → Active → Grace → Inactive → Freeze
    ↓
[Renew Plan] → new plan replaces old (or archive old)
```

---

*Generated from GYM_TAG_OG.xlsx — Academy Tracker & Fees Calculator sheets*
