"use client";

import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  kpiStats,
  revenueByMonth,
  studentsByProgram,
  revenueBySource,
  weeklyAttendance,
  recentActivity,
  formatINR,
} from "@/lib/sample/dashboard";

const chartTooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e4e4e7",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
};

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-900 tabular-nums break-words">
        {value}
      </p>
      {(sub || trend) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {trend && (
            <span
              className={
                trendUp === false
                  ? "font-medium text-rose-600"
                  : "font-medium text-emerald-600"
              }
            >
              {trend}
            </span>
          )}
          {sub && <span className="text-zinc-400">{sub}</span>}
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  footer,
  chartClassName = "h-52 sm:h-64",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  chartClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      )}
      <div className={`mt-4 ${chartClassName}`}>{children}</div>
      {footer}
    </div>
  );
}

function PieLegend({ data }: { data: { name: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
      {data.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

export default function DashboardOverview({
  firstName,
}: {
  firstName: string;
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const attendanceData = weeklyAttendance.map((d) => ({
    day: d.day,
    rate: Math.round((d.present / (d.present + d.absent)) * 100),
  }));
  const chartMargin = isMobile
    ? { top: 8, right: 4, left: -16, bottom: 0 }
    : { top: 8, right: 8, left: -8, bottom: 0 };

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Overview of enrollment, attendance, and revenue for your academy.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80">
          Sample data — live stats coming soon
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Students enrolled"
          value={kpiStats.studentsEnrolled.toString()}
          trend={`+${kpiStats.studentsChange} this month`}
          trendUp
        />
        <KpiCard
          label="Active trainers"
          value={kpiStats.activeTrainers.toString()}
          sub={`${kpiStats.trialsThisWeek} trial sessions this week`}
        />
        <KpiCard
          label="Revenue (June)"
          value={formatINR(kpiStats.monthlyRevenue)}
          trend={`+${kpiStats.revenueChange}% vs last month`}
          trendUp
        />
        <KpiCard
          label="Attendance rate"
          value={`${kpiStats.attendanceRate}%`}
          trend={`+${kpiStats.attendanceChange}%`}
          trendUp
          sub={`${formatINR(kpiStats.pendingFees)} pending · ${kpiStats.pendingCount} accounts`}
        />
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 min-w-0">
        <ChartCard
          title="Monthly revenue"
          description="Last 6 months (₹ lakhs)"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={revenueByMonth} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: isMobile ? 10 : 12, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={isMobile ? 36 : 48}
                tick={{ fontSize: isMobile ? 10 : 12, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}L`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [`₹${value}L`, "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f16d28"
                strokeWidth={2.5}
                dot={{ fill: "#f16d28", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Students by program"
          description="Current active enrollments"
          chartClassName="h-48 sm:h-56"
          footer={<PieLegend data={studentsByProgram} />}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={studentsByProgram}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 52}
                outerRadius={isMobile ? 64 : 76}
                paddingAngle={2}
              >
                {studentsByProgram.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value, name) => [`${value} students`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3 min-w-0">
        <div className="lg:col-span-1 min-w-0">
          <ChartCard
            title="Revenue mix"
            description="Share by source this month"
            chartClassName="h-48 sm:h-64"
            footer={<PieLegend data={revenueBySource} />}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 72 : 88}
                >
                  {revenueBySource.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-2 min-w-0">
          <ChartCard
            title="Weekly attendance"
            description="Daily attendance rate (%)"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={attendanceData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: isMobile ? 10 : 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 32 : 48}
                  domain={[80, 100]}
                  tick={{ fontSize: isMobile ? 10 : 12, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`${value}%`, "Attendance"]}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 32 : 48} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
        <h3 className="text-sm font-medium text-zinc-900">Recent activity</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Latest updates across the academy</p>
        <ul className="mt-4 divide-y divide-zinc-100">
          {recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm text-zinc-700">{item.text}</span>
              <span className="text-xs text-zinc-400 shrink-0 sm:pl-4">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
