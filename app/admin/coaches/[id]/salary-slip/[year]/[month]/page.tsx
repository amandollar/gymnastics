import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { getCoachById, getCoachEarnings } from "@/lib/services/coaches";
import { getAcademyProfile } from "@/lib/services/academy";
import { prisma } from "@/lib/prisma";
import { SalarySlip, type SalarySlipData } from "@/app/admin/_components/coaches/SalarySlip";
import { getMonthSalaryMultiplier } from "@/lib/utils/salary";

interface PageProps {
  params: Promise<{ id: string; year: string; month: string }>;
}

export default async function CoachSalarySlipPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: coachId, year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const [coach, academyProfile, earningsRows] = await Promise.all([
    getCoachById(coachId),
    getAcademyProfile(),
    getCoachEarnings(coachId),
  ]);

  if (!coach) {
    notFound();
  }

  // Fetch salary payment details
  const salaryPayment = await (prisma as any).coachSalaryPayment.findUnique({
    where: {
      coachId_year_month: {
        coachId,
        year,
        month,
      },
    },
  });

  // Calculate working days and absent days
  const daysInMonth = new Date(year, month, 0).getDate();
  let sundaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === 0) {
      sundaysCount++;
    }
  }
  const workingDays = daysInMonth - sundaysCount;

  // Fetch attendance records for this coach and month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const attendances = await (prisma as any).coachAttendance.findMany({
    where: {
      coachId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  const absentDays = attendances.filter((a: any) => a.status === "ABSENT").length;

  const multiplier = getMonthSalaryMultiplier(
    coach.joinDate,
    coach.leftDate ?? null,
    year,
    month
  );
  const proRatedFixedSalary = Math.round(coach.fixedSalary * multiplier);

  const deduction = workingDays > 0 ? Math.round((proRatedFixedSalary / workingDays) * absentDays) : 0;

  // Personal Training breakdown for this month
  const filteredEarningsForMonth = earningsRows.filter((r) =>
    r.months.some((m) => m.year === year && m.month === month)
  );

  const ptStudentsBreakdown = filteredEarningsForMonth.map((row) => {
    const mData = row.months.find((m) => m.year === year && m.month === month);
    const monthlyAmount = mData?.amount ?? 0;
    const proRatedAmount = Math.round(monthlyAmount * multiplier);
    return {
      studentName: row.studentName,
      studentNumber: row.studentNumber,
      planMonths: row.planMonths,
      totalFee: row.totalFee,
      commissionPercent: row.commissionPercent,
      coachShare: row.coachShare,
      monthlyAmount: proRatedAmount,
    };
  }).filter((s) => s.monthlyAmount > 0);

  const ptEarnings = ptStudentsBreakdown.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const netPayout = Math.max(0, proRatedFixedSalary - deduction) + ptEarnings;

  const data: SalarySlipData = {
    coach: {
      name: coach.name,
      contactNumber: coach.contactNumber,
      email: coach.email,
      joinDate: coach.joinDate,
      timing: coach.timing,
      specialization: coach.specialization,
      fixedSalary: proRatedFixedSalary,
      role: coach.role as "COACH" | "STAFF",
    },
    academyProfile: {
      email: academyProfile?.email ?? null,
      phone: academyProfile?.phone ?? null,
      phone2: academyProfile?.phone2 ?? null,
      address: academyProfile?.address ?? null,
      website: academyProfile?.website ?? null,
    },
    year,
    month,
    workingDays,
    absentDays,
    deduction,
    ptEarnings,
    netPayout,
    isPaid: salaryPayment?.paid ?? false,
    paidAt: salaryPayment?.paidAt ?? null,
    ptStudentsBreakdown,
  };

  return (
    <>
      {/* Auto-print on load */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          `,
        }}
      />
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
      <SalarySlip data={data} />
    </>
  );
}
