"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  CreditCard,
  Briefcase,
  TrendingUp,
  Search,
  Printer,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";

// Types matching server-side queries
interface Student {
  id: string;
  studentNumber: number;
  name: string;
  avatarUrl: string | null;
}

interface StudentPlan {
  planType: string;
}

interface PaymentRecord {
  id: string;
  invoiceNumber: number;
  studentId: string;
  studentPlanId: string;
  amount: number;
  method: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  notes: string | null;
  paidAt: string;
  createdAt: string;
  student: Student;
  studentPlan: StudentPlan;
}

interface Coach {
  id: string;
  name: string;
  status: string;
  role: string;
  fixedSalary: number;
}

interface CoachSalaryPayment {
  id: string;
  coachId: string;
  year: number;
  month: number;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
  coach: Coach;
}

interface ActivePlanWithPayments {
  id: string;
  studentId: string;
  planType: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  fee: number;
  isActive: boolean;
  student: Student;
  payments: { amount: number }[];
}

interface FinancePageClientProps {
  payments: PaymentRecord[];
  salaryPayments: CoachSalaryPayment[];
  activePlans: ActivePlanWithPayments[];
}

export default function FinancePageClient({
  payments,
  salaryPayments,
  activePlans,
}: FinancePageClientProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"revenue" | "expenses" | "outstanding">("revenue");
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueMethodFilter, setRevenueMethodFilter] = useState<string>("ALL");
  const [outstandingStatusFilter, setOutstandingStatusFilter] = useState<string>("OUTSTANDING_ONLY");
  
  // Date range filters
  const [financeFrom, setFinanceFrom] = useState("");
  const [financeTo, setFinanceTo] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when search, filter, or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, revenueMethodFilter, outstandingStatusFilter, financeFrom, financeTo]);

  // Helper: Month formatter
  const getMonthName = (month: number, year: number) => {
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  };

  // Helper: Currency Formatter
  const formatCurrency = (amount: number) => {
    return "₹" + amount.toLocaleString("en-IN");
  };

  // 1. Calculate active student plans outstanding dues
  const activePlansWithBalances = useMemo(() => {
    return activePlans.map((plan) => {
      const paid = plan.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, plan.fee - paid);
      let status: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
      if (paid >= plan.fee) {
        status = "PAID";
      } else if (paid > 0) {
        status = "PARTIAL";
      }
      return {
        ...plan,
        paid,
        outstanding,
        status,
      };
    });
  }, [activePlans]);

  // 2. Filter Payments (Revenue)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Date range filter
      if (financeFrom) {
        const fromDate = new Date(financeFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (new Date(p.paidAt) < fromDate) return false;
      }
      if (financeTo) {
        const toDate = new Date(financeTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(p.paidAt) > toDate) return false;
      }

      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = p.student?.name.toLowerCase() || "";
        const num = p.student?.studentNumber?.toString() || "";
        const invoice = p.invoiceNumber?.toString() || "";
        const notes = p.notes?.toLowerCase() || "";
        const method = p.method.toLowerCase();
        if (
          !name.includes(q) &&
          !num.includes(q) &&
          !invoice.includes(q) &&
          !notes.includes(q) &&
          !method.includes(q)
        ) {
          return false;
        }
      }

      // Dropdown method filter
      if (revenueMethodFilter !== "ALL" && p.method !== revenueMethodFilter) {
        return false;
      }

      return true;
    });
  }, [payments, financeFrom, financeTo, searchQuery, revenueMethodFilter]);

  // 3. Filter Salary Payouts (Expenses)
  const filteredSalaryPayments = useMemo(() => {
    return salaryPayments.filter((s) => {
      // Date range filter
      const payDate = s.paidAt ? new Date(s.paidAt) : new Date(s.year, s.month - 1, 1);
      if (financeFrom) {
        const fromDate = new Date(financeFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (payDate < fromDate) return false;
      }
      if (financeTo) {
        const toDate = new Date(financeTo);
        toDate.setHours(23, 59, 59, 999);
        if (payDate > toDate) return false;
      }

      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = s.coach?.name.toLowerCase() || "";
        const monthLabel = getMonthName(s.month, s.year).toLowerCase();
        if (!name.includes(q) && !monthLabel.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [salaryPayments, financeFrom, financeTo, searchQuery]);

  // 4. Filter Outstanding Plans
  const filteredActivePlans = useMemo(() => {
    return activePlansWithBalances.filter((plan) => {
      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = plan.student?.name.toLowerCase() || "";
        const num = plan.student?.studentNumber?.toString() || "";
        const type = plan.planType.toLowerCase();
        if (!name.includes(q) && !num.includes(q) && !type.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (outstandingStatusFilter === "OUTSTANDING_ONLY") {
        return plan.outstanding > 0;
      } else if (outstandingStatusFilter !== "ALL" && plan.status !== outstandingStatusFilter) {
        return false;
      }

      return true;
    });
  }, [activePlansWithBalances, searchQuery, outstandingStatusFilter]);

  // 5. KPIs (Calculated dynamically, respecting date filters for Revenue & Expenses)
  const stats = useMemo(() => {
    const totalRev = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExp = filteredSalaryPayments
      .filter((s) => s.paid)
      .reduce((sum, s) => sum + s.amount, 0);
    const profit = totalRev - totalExp;
    
    // Outstanding remains snapshot of active plans
    const totalOut = activePlansWithBalances.reduce((sum, p) => sum + p.outstanding, 0);

    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netProfit: profit,
      totalOutstanding: totalOut,
    };
  }, [filteredPayments, filteredSalaryPayments, activePlansWithBalances]);

  // Trigger export endpoint
  const handleCSVExport = () => {
    const url = `/api/export/finance` + (financeFrom || financeTo ? `?from=${financeFrom}&to=${financeTo}` : "");
    window.open(url, "_blank");
  };

  // Reset all filters
  const resetFilters = () => {
    setFinanceFrom("");
    setFinanceTo("");
    setSearchQuery("");
    setRevenueMethodFilter("ALL");
    setOutstandingStatusFilter("OUTSTANDING_ONLY");
  };

  // Pagination Helper
  const paginatedData = useMemo(() => {
    const data =
      activeTab === "revenue"
        ? filteredPayments
        : activeTab === "expenses"
        ? filteredSalaryPayments
        : filteredActivePlans;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: data.slice(startIndex, endIndex),
      totalItems: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / itemsPerPage)),
    };
  }, [activeTab, filteredPayments, filteredSalaryPayments, filteredActivePlans, currentPage]);

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
            Finance Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Track business cashflow, student fee receipts, salary slip disbursements, and outstanding collections.
          </p>
        </div>
        
        {/* Export / Date Range Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-1 backdrop-blur-xs">
            <input
              type="date"
              value={financeFrom}
              onChange={(e) => setFinanceFrom(e.target.value)}
              className="bg-transparent border-0 px-2 py-1 text-xs focus:ring-0 text-zinc-700 dark:text-zinc-300 [&::-webkit-calendar-picker-indicator]:dark:invert"
              title="From Date"
            />
            <span className="text-zinc-400 dark:text-zinc-600 text-xs">to</span>
            <input
              type="date"
              value={financeTo}
              onChange={(e) => setFinanceTo(e.target.value)}
              className="bg-transparent border-0 px-2 py-1 text-xs focus:ring-0 text-zinc-700 dark:text-zinc-300 [&::-webkit-calendar-picker-indicator]:dark:invert"
              title="To Date"
            />
            {(financeFrom || financeTo) && (
              <button
                onClick={resetFilters}
                className="p-1 text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                title="Reset Dates"
              >
                <RefreshCw className="h-3 w-3 animate-spin-once" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleCSVExport}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-emerald-500/10 dark:bg-emerald-450/5 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extralight font-outfit text-zinc-900 dark:text-zinc-50 tracking-tight">
              {formatCurrency(stats.totalRevenue)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            {financeFrom || financeTo ? "In selected range" : "All-time fee payments"}
          </p>
        </div>

        {/* KPI 2: Expenses */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-brand-orange-500/10 dark:bg-brand-orange-500/5 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Salary Expenses
            </span>
            <span className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-brand-orange-655 dark:text-brand-orange-400">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extralight font-outfit text-zinc-900 dark:text-zinc-50 tracking-tight">
              {formatCurrency(stats.totalExpenses)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            {financeFrom || financeTo ? "In selected range" : "Disbursed staff payouts"}
          </p>
        </div>

        {/* KPI 3: Net Cashflow */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-blue-500/10 dark:bg-blue-450/5 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Net Profit
            </span>
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-2xl sm:text-3xl font-semibold font-outfit tracking-tight ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {formatCurrency(stats.netProfit)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            Revenue minus Expenses
          </p>
        </div>

        {/* KPI 4: Outstanding Dues */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-purple-500/10 dark:bg-purple-450/5 blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Outstanding Fees
            </span>
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-655 dark:text-purple-400">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extralight font-outfit text-zinc-900 dark:text-zinc-50 tracking-tight">
              {formatCurrency(stats.totalOutstanding)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            Collectable from active plans
          </p>
        </div>
      </div>

      {/* Main Tabbed Panel Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden backdrop-blur-xs">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3 gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl self-start">
            <button
              onClick={() => setActiveTab("revenue")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "revenue"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-800/40"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Payments History
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-800/40"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Employee Payouts
            </button>
            <button
              onClick={() => setActiveTab("outstanding")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "outstanding"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/50 dark:border-zinc-800/40"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Outstanding Balances
            </button>
          </div>

          {/* Filtering & Searching Controls inside tab header */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Payment Method filter (only for revenue tab) */}
            {activeTab === "revenue" && (
              <div className="relative">
                <select
                  value={revenueMethodFilter}
                  onChange={(e) => setRevenueMethodFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/30 cursor-pointer pr-8 appearance-none"
                >
                  <option value="ALL">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-450 pointer-events-none" />
              </div>
            )}

            {/* Outstanding Status filter (only for outstanding tab) */}
            {activeTab === "outstanding" && (
              <div className="relative">
                <select
                  value={outstandingStatusFilter}
                  onChange={(e) => setOutstandingStatusFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/30 cursor-pointer pr-8 appearance-none"
                >
                  <option value="OUTSTANDING_ONLY">Outstanding Dues Only</option>
                  <option value="ALL">All Active Plans</option>
                  <option value="UNPAID">Fully Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PAID">Fully Paid</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-450 pointer-events-none" />
              </div>
            )}

            {/* General Text Search */}
            <div className="relative w-full sm:w-48">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-zinc-450" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "revenue"
                    ? "Search name, bill, notes..."
                    : activeTab === "expenses"
                    ? "Search employee..."
                    : "Search student..."
                }
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/30"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Payments History (Revenue) */}
        {activeTab === "revenue" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Paid At</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Plan Type</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-sm text-zinc-700 dark:text-zinc-300">
                {paginatedData.items.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      #{p.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium whitespace-nowrap">
                      {new Date(p.paidAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {p.student && (
                          <>
                            <StudentAvatar student={p.student} size={28} className="ring-1 ring-zinc-200/50" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                                {p.student.name}
                              </span>
                              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                                TAG {p.student.studentNumber}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350 text-[10px]">
                        {p.studentPlan?.planType || "REGULAR"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-150 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-450 dark:text-zinc-500 max-w-[200px] truncate">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
                {paginatedData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-450 dark:text-zinc-550">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <CreditCard className="h-6 w-6 text-zinc-350 dark:text-zinc-650" />
                        <p className="font-medium text-zinc-600 dark:text-zinc-400">No payment receipts found</p>
                        <p className="text-xs">Try adjusting your filters or date selection.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Coach Payouts (Expenses) */}
        {activeTab === "expenses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Employee / Coach</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Fixed Salary</th>
                  <th className="px-6 py-3.5">Total Paid</th>
                  <th className="px-6 py-3.5">Payout Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-sm text-zinc-700 dark:text-zinc-300">
                {paginatedData.items.map((s: any) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-xs whitespace-nowrap">
                      {getMonthName(s.month, s.year)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                          {s.coach?.name || "Unknown Coach"}
                        </span>
                        <span className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">
                          {s.coach?.role || "COACH"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider ${
                        s.coach?.status === "WORKING"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}>
                        {s.coach?.status || "WORKING"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap font-medium text-zinc-500">
                      {formatCurrency(s.coach?.fixedSalary || 0)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-150 whitespace-nowrap">
                      {formatCurrency(s.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.paid
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-orange-50 dark:bg-orange-950/30 text-brand-orange-655 dark:text-brand-orange-400"
                      }`}>
                        {s.paid ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/coaches/${s.coachId}/salary-slip/${s.year}/${s.month}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-zinc-450 dark:text-zinc-400" />
                        Slip
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginatedData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-450 dark:text-zinc-550">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Briefcase className="h-6 w-6 text-zinc-350 dark:text-zinc-650" />
                        <p className="font-medium text-zinc-600 dark:text-zinc-400">No salary payouts found</p>
                        <p className="text-xs">Try adjusting your filters or date selection.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Outstanding Balances */}
        {activeTab === "outstanding" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Plan Type</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Total Fee</th>
                  <th className="px-6 py-3.5">Paid So Far</th>
                  <th className="px-6 py-3.5">Outstanding Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-sm text-zinc-700 dark:text-zinc-300">
                {paginatedData.items.map((plan: any) => (
                  <tr key={plan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {plan.student && (
                          <>
                            <StudentAvatar student={plan.student} size={28} className="ring-1 ring-zinc-200/50" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                                {plan.student.name}
                              </span>
                              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                                TAG {plan.student.studentNumber}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350 text-[10px]">
                        {plan.planType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-450 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(plan.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                      {" - "}
                      {new Date(plan.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-550 whitespace-nowrap">
                      {formatCurrency(plan.fee)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-emerald-600 whitespace-nowrap">
                      {formatCurrency(plan.paid)}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                      <span className={plan.outstanding > 0 ? "text-red-500" : "text-zinc-450 dark:text-zinc-550 font-normal"}>
                        {formatCurrency(plan.outstanding)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        plan.status === "PAID"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : plan.status === "PARTIAL"
                          ? "bg-orange-50 dark:bg-orange-950/30 text-brand-orange-655 dark:text-brand-orange-400"
                          : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                      }`}>
                        {plan.status === "PAID"
                          ? "Fully Paid"
                          : plan.status === "PARTIAL"
                          ? "Partial"
                          : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-450 dark:text-zinc-550">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Users className="h-6 w-6 text-zinc-350 dark:text-zinc-650" />
                        <p className="font-medium text-zinc-600 dark:text-zinc-400">No active student plans found</p>
                        <p className="text-xs">All active students are fully settled for this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {paginatedData.totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.min(paginatedData.totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.min(paginatedData.totalItems, currentPage * itemsPerPage)}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{paginatedData.totalItems}</span> results
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Page {currentPage} of {paginatedData.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(paginatedData.totalPages, prev + 1))}
                disabled={currentPage === paginatedData.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
