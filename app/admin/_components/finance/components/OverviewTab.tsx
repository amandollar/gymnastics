import React, { useRef, useEffect } from "react";
import {
  TrendingUp,
  Briefcase,
  IndianRupee,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface OverviewTabProps {
  monthsList: { value: string; label: string }[];
  selectedMonthStr: string;
  setSelectedMonthStr: (val: string) => void;
  currentMonthData: {
    income: number;
    spent: number;
    saving: number;
    investment: number;
    pieData: { name: string; value: number }[];
    incomeData: { name: string; value: number }[];
  };
  insightsData: { name: string; Income: number; Expenditure: number }[];
  cashflowOffset: number;
  setCashflowOffset: React.Dispatch<React.SetStateAction<number>>;
  cashflowViewMode: "monthly" | "yearly";
  setCashflowViewMode: (mode: "monthly" | "yearly") => void;
  formatCur: (val: number) => string;
  COLORS: string[];
}

export default function OverviewTab({
  monthsList,
  selectedMonthStr,
  setSelectedMonthStr,
  currentMonthData,
  insightsData,
  cashflowOffset,
  setCashflowOffset,
  cashflowViewMode,
  setCashflowViewMode,
  formatCur,
  COLORS,
}: OverviewTabProps) {
  const chartScrollRef = useRef<HTMLDivElement>(null);

  // On mount and whenever the data window changes, scroll to the rightmost
  // position so the current month (last bar) is always visible.
  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [insightsData]);

  return (
    <div className="space-y-4">
      {/* Month Selector & KPI Summary Wrapper */}
      <div className="space-y-4">
        {/* Pill-shaped month selector */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {monthsList.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMonthStr(m.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedMonthStr === m.value
                  ? "bg-brand-orange-500 text-white shadow-md"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* KPI Summary */}
        <div className="stats-container">
          <div className="stats-grid">
            {/* Stat 1: Total Income */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex items-center gap-4 text-left">
              <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40 shrink-0">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl sm:text-3xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight leading-none">
                  {formatCur(currentMonthData.income)}
                </span>
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">
                  Total Income
                </p>
              </div>
            </div>

            {/* Stat 2: Total Spent */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex items-center gap-4 text-left">
              <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200/40 dark:border-orange-800/40 shrink-0">
                <Briefcase className="h-4 w-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl sm:text-3xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight leading-none">
                  {formatCur(currentMonthData.spent)}
                </span>
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">
                  Total Spent
                </p>
              </div>
            </div>

            {/* Stat 3: Saving */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex items-center gap-4 text-left">
              <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/40 shrink-0">
                <IndianRupee className="h-4 w-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl sm:text-3xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight leading-none">
                  {formatCur(currentMonthData.saving)}
                </span>
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">
                  Saving
                </p>
              </div>
            </div>

            {/* Stat 4: Investment */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex items-center gap-4 text-left">
              <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-purple-50 dark:bg-purple-955/20 text-purple-600 dark:text-purple-400 border border-purple-200/40 dark:border-purple-800/40 shrink-0">
                <CreditCard className="h-4 w-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl sm:text-3xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight leading-none">
                  {formatCur(currentMonthData.investment)}
                </span>
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">
                  Investment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Combined Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-6">
              Spending by Category
            </h3>
            {currentMonthData.pieData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Donut Chart */}
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentMonthData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {currentMonthData.pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCur(Number(val))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed breakdown list */}
                <div className="space-y-1.5">
                  {currentMonthData.pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="font-semibold text-zinc-750 dark:text-zinc-300 text-xs">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs font-mono">
                        {formatCur(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-zinc-400">
                No expenses logged for this month
              </div>
            )}
          </div>
        </div>

        {/* Income Horizontal Bar Chart Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-6">
              Income by Source
            </h3>
            {currentMonthData.incomeData.length > 0 ? (
              <div
                style={{
                  height: Math.max(80, currentMonthData.incomeData.length * 45),
                }}
                className="w-full pr-4"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentMonthData.incomeData}
                    layout="vertical"
                    margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: "#71717a",
                        fontWeight: 500,
                      }}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val: any) => formatCur(Number(val))}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 9999, 9999, 0]} barSize={16}>
                      {currentMonthData.incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(val: any) => formatCur(Number(val))}
                        className="fill-zinc-700 dark:fill-zinc-300 font-mono text-[10px] font-bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-zinc-400">
                No income logged for this month
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            Cashflow Overview
          </h3>
          <div className="flex items-center gap-4">
            {/* Monthly / Yearly Mode Toggle */}
            <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCashflowViewMode("monthly");
                  setCashflowOffset(0);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  cashflowViewMode === "monthly"
                    ? "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashflowViewMode("yearly");
                  setCashflowOffset(0);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  cashflowViewMode === "yearly"
                    ? "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center gap-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setCashflowOffset((prev) => prev + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-550 dark:text-zinc-400 hover:text-zinc-855 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
                title={cashflowViewMode === "monthly" ? "Older Months" : "Older Years"}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={cashflowOffset === 0}
                onClick={() => setCashflowOffset((prev) => Math.max(0, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-550 dark:text-zinc-400 hover:text-zinc-855 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={cashflowViewMode === "monthly" ? "Newer Months" : "Newer Years"}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto w-full" ref={chartScrollRef}>
          <div className="h-80" style={{ minWidth: "840px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightsData} margin={{ top: 20, right: 4, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f4620" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(val: any) => formatCur(Number(val))}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="Income" fill="#10b981" radius={[9999, 9999, 2, 2]} barSize={16} />
                <Bar dataKey="Expenditure" fill="#f16d28" radius={[9999, 9999, 2, 2]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
