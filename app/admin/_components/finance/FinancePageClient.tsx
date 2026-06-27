"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  Briefcase,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Plus,
  X,
  CreditCard,
  Trash2,
  Download,
  Pencil,
  Check,
  Repeat,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import OverviewTab from "./components/OverviewTab";
import TransactionsTab from "./components/TransactionsTab";
import BudgetTab from "./components/BudgetTab";
import { OverviewSkeleton, TransactionsSkeleton, BudgetSkeleton } from "./components/TabSkeletons";
import {
  addFinanceTransaction,
  setBudgetCategory,
  addAutoPay,
  editAutoPay,
  deleteAutoPay,
  addCategory,
  updateCategoryName,
  deleteCategory,
} from "@/app/admin/_actions/finance";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// --- Types ---
interface FinanceTransaction {
  id: string;
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

interface BudgetCategory {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

interface AutoPay {
  id: string;
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface FinancePageClientProps {
  payments: any[];
  salaryPayments: any[];
  activePlans: any[]; // Kept for future use if needed
  financeTransactions: FinanceTransaction[];
  budgetCategories: BudgetCategory[];
  autoPays: AutoPay[];
  financeCategories: any[];
}

interface UnifiedTransaction {
  id: string;
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  date: Date;
  description: string;
  isManual: boolean;
}

// --- Colors for Pie Chart ---
const COLORS = [
  "#10b981",
  "#f16d28",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
];

export default function FinancePageClient({
  payments,
  salaryPayments,
  financeTransactions,
  budgetCategories,
  autoPays,
  financeCategories,
}: FinancePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial tab from search params
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "transactions" || tabParam === "budget"
      ? (tabParam as "transactions" | "budget")
      : "overview";

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "budget"
  >(initialTab);

  // Sync state if URL changes externally (e.g. back/forward button)
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const validTab =
      currentTab === "transactions" || currentTab === "budget"
        ? (currentTab as "transactions" | "budget")
        : "overview";
    if (validTab !== activeTab) {
      setActiveTab(validTab);
    }
  }, [searchParams, activeTab]);

  // Handle Tab change and update search parameters with transition caching
  const [tabPending, startTabTransition] = useTransition();

  const handleTabChange = (tab: "overview" | "transactions" | "budget") => {
    startTabTransition(() => {
      setActiveTab(tab);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Generate last 12 months for selector (current month first)
  const monthsList = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        label: d.toLocaleString("en-IN", { month: "short", year: "numeric" }),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      });
    }
    return list;
  }, []);

  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(
    monthsList[0].value,
  );
  const [cashflowOffset, setCashflowOffset] = useState<number>(0);
  const [cashflowViewMode, setCashflowViewMode] = useState<"monthly" | "yearly">("monthly");

  const [tempBudgets, setTempBudgets] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [txType, setTxType] = useState<"INCOME" | "EXPENDITURE" | "INVESTMENT">(
    "EXPENDITURE",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("Rent");
  const [customCategory, setCustomCategory] = useState<string>("");

  const [showAutoPayRules, setShowAutoPayRules] = useState(false);
  const [repeatEveryMonth, setRepeatEveryMonth] = useState(false);
  const [editingAutoPayId, setEditingAutoPayId] = useState<string | null>(null);
  const [editApCategory, setEditApCategory] = useState("");
  const [editApAmount, setEditApAmount] = useState("");
  const [editApDescription, setEditApDescription] = useState("");

  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [categorySettingsTab, setCategorySettingsTab] = useState<
    "EXPENDITURE" | "INCOME"
  >("EXPENDITURE");
  const [categoryDrafts, setCategoryDrafts] = useState<
    Array<{
      id: string;
      name: string;
      budget: string;
      isDeleted: boolean;
      isNew: boolean;
      type: "INCOME" | "EXPENDITURE";
    }>
  >([]);

  const openCategorySettings = () => {
    const drafts = financeCategories.map((c) => ({
      id: c.id,
      name: c.name,
      budget: getBudgetForCategory(c.name).toString(),
      isDeleted: false,
      isNew: false,
      type:
        c.type === "INCOME"
          ? "INCOME"
          : ("EXPENDITURE" as "INCOME" | "EXPENDITURE"),
    }));
    setCategoryDrafts(drafts);
    setCategorySettingsTab(txType === "INCOME" ? "INCOME" : "EXPENDITURE");
    setShowCategorySettings(true);
  };

  const updateDraftName = (id: string, name: string) => {
    setCategoryDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name } : d)),
    );
  };

  const updateDraftBudget = (id: string, budget: string) => {
    setCategoryDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, budget } : d)),
    );
  };

  const deleteDraftRow = (id: string) => {
    setCategoryDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isDeleted: true } : d)),
    );
  };

  const addDraftRow = () => {
    setCategoryDrafts((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        name: "",
        budget: "",
        isDeleted: false,
        isNew: true,
        type: categorySettingsTab,
      },
    ]);
  };

  const saveAllCategoryChanges = () => {
    startTransition(async () => {
      for (const draft of categoryDrafts) {
        const original = financeCategories.find((c) => c.id === draft.id);

        if (draft.isDeleted) {
          if (!draft.isNew) {
            await deleteCategory({ id: draft.id });
          }
          continue;
        }

        if (draft.isNew) {
          if (draft.name.trim()) {
            await addCategory({ name: draft.name.trim(), type: draft.type });
            if (draft.type === "EXPENDITURE" && draft.budget) {
              const amt = parseInt(draft.budget) || 0;
              await setBudgetCategory({
                category: draft.name.trim(),
                amount: amt,
                month: currentMonthData.month,
                year: currentMonthData.year,
              });
            }
          }
          continue;
        }

        if (original) {
          if (draft.name.trim() && draft.name.trim() !== original.name) {
            await updateCategoryName({
              id: draft.id,
              newName: draft.name.trim(),
            });
          }
          if (draft.type === "EXPENDITURE") {
            const originalBudget = getBudgetForCategory(original.name);
            const draftBudgetAmt = parseInt(draft.budget) || 0;
            if (draftBudgetAmt !== originalBudget) {
              await setBudgetCategory({
                category: draft.name.trim() || original.name,
                amount: draftBudgetAmt,
                month: currentMonthData.month,
                year: currentMonthData.year,
              });
            }
          }
        }
      }
      setShowCategorySettings(false);
    });
  };

  useEffect(() => {
    setTempBudgets({});
    setEditingCategory(null);
  }, [selectedMonthStr]);

  useEffect(() => {
    const defaultCat = txType === "INCOME" ? "Student Fees" : "Rent";
    setSelectedCategory(defaultCat);
    setCustomCategory("");
  }, [txType]);

  const handleStartEdit = (category: string, currentVal: number) => {
    setTempBudgets((prev) => ({
      ...prev,
      [category]: currentVal === 0 ? "" : currentVal.toString(),
    }));
    setEditingCategory(category);
  };

  const handleSaveBudget = (category: string) => {
    const val =
      tempBudgets[category] !== undefined ? tempBudgets[category] : "";
    handleBudgetBlur(category, val);
    setEditingCategory(null);
  };

  const handleCancelEdit = (category: string) => {
    setEditingCategory(null);
    setTempBudgets((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const handleBudgetBlur = async (category: string, valueStr: string) => {
    const amount = parseInt(valueStr) || 0;
    startTransition(async () => {
      await setBudgetCategory({
        category,
        amount,
        month: currentMonthData.month,
        year: currentMonthData.year,
      });
    });
  };

  // Modals
  const [showAddTx, setShowAddTx] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Unified Transactions List
  const allTransactions = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];

    // 1. Auto Income (Student Fees)
    payments.forEach((p) => {
      list.push({
        id: `auto-inc-${p.id}`,
        type: "INCOME",
        category: "Student Fees",
        amount: p.amount,
        date: new Date(p.paidAt),
        description: `Fee: ${p.student?.name} (${p.invoiceNumber})`,
        isManual: false,
      });
    });

    // 2. Auto Expenses (Salaries)
    salaryPayments.forEach((s) => {
      if (s.paid) {
        list.push({
          id: `auto-exp-${s.id}`,
          type: "EXPENDITURE",
          category: "Salaries",
          amount: s.amount,
          date: s.paidAt
            ? new Date(s.paidAt)
            : new Date(s.year, s.month - 1, 1),
          description: `Salary: ${s.coach?.name}`,
          isManual: false,
        });
      }
    });

    // 3. Manual Transactions
    financeTransactions.forEach((t) => {
      list.push({
        id: `man-${t.id}`,
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: new Date(t.date),
        description: t.description || "Manual Entry",
        isManual: true,
      });
    });

    // 4. Auto Pay Transactions (Recurring)
    autoPays.forEach((ap) => {
      monthsList.forEach((m) => {
        const [year, month] = m.value.split("-").map(Number);
        const startOfActiveMonth = new Date(year, month - 1, 1);
        const endOfActiveMonth = new Date(year, month, 0, 23, 59, 59);

        const ruleStart = new Date(ap.startDate);
        const ruleEnd = ap.endDate ? new Date(ap.endDate) : null;

        const isStarted = ruleStart <= endOfActiveMonth;
        const isNotEnded = !ruleEnd || ruleEnd >= startOfActiveMonth;

        if (isStarted && isNotEnded) {
          list.push({
            id: `autopay-${ap.id}-${m.value}`,
            type: ap.type,
            category: ap.category,
            amount: ap.amount,
            date: new Date(year, month - 1, 15),
            description: ap.description
              ? `${ap.description} (Auto)`
              : "Auto-Pay",
            isManual: true,
          });
        }
      });
    });

    // Sort descending by date
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [payments, salaryPayments, financeTransactions, autoPays, monthsList]);

  // Derived state for currently selected month
  const currentMonthData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonthStr.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const txInMonth = allTransactions.filter(
      (t) => t.date.getFullYear() === year && t.date.getMonth() + 1 === month,
    );

    const income = txInMonth
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const spent = txInMonth
      .filter((t) => t.type === "EXPENDITURE")
      .reduce((acc, t) => acc + t.amount, 0);
    const investment = txInMonth
      .filter((t) => t.type === "INVESTMENT")
      .reduce((acc, t) => acc + t.amount, 0);
    const saving = income - spent;

    // Spending by category
    const spendingByCategory = txInMonth
      .filter((t) => t.type === "EXPENDITURE")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

    const pieData = Object.entries(spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Income by category
    const incomeByCategory = txInMonth
      .filter((t) => t.type === "INCOME")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

    const incomeData = Object.entries(incomeByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Budgets for selected month
    const budgets = budgetCategories.filter(
      (b) => b.year === year && b.month === month,
    );

    return {
      txInMonth,
      income,
      spent,
      investment,
      saving,
      pieData,
      incomeData,
      budgets,
      year,
      month,
    };
  }, [allTransactions, selectedMonthStr, budgetCategories]);

  // All-time Net
  const allTimeNet = useMemo(() => {
    const totalInc = allTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExp = allTransactions
      .filter((t) => t.type === "EXPENDITURE")
      .reduce((acc, t) => acc + t.amount, 0);
    return totalInc - totalExp;
  }, [allTransactions]);

  // Insights Data (Monthly vs Yearly cashflow with offset)
  const insightsData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (cashflowViewMode === "yearly") {
      // Show 5 years at a time
      const baseYear = now.getFullYear() - cashflowOffset;
      for (let i = 4; i >= 0; i--) {
        const y = baseYear - i;
        const tx = allTransactions.filter((t) => t.date.getFullYear() === y);
        const inc = tx
          .filter((t) => t.type === "INCOME")
          .reduce((acc, t) => acc + t.amount, 0);
        const exp = tx
          .filter((t) => t.type === "EXPENDITURE")
          .reduce((acc, t) => acc + t.amount, 0);

        data.push({
          name: y.toString(),
          Income: inc,
          Expenditure: exp,
        });
      }
    } else {
      // Show 12 months at a time
      const baseDate = new Date(now.getFullYear(), now.getMonth() - cashflowOffset, 1);
      for (let i = 11; i >= 0; i--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const tx = allTransactions.filter(
          (t) => t.date.getFullYear() === y && t.date.getMonth() + 1 === m,
        );
        const inc = tx
          .filter((t) => t.type === "INCOME")
          .reduce((acc, t) => acc + t.amount, 0);
        const exp = tx
          .filter((t) => t.type === "EXPENDITURE")
          .reduce((acc, t) => acc + t.amount, 0);

        data.push({
          name: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
          Income: inc,
          Expenditure: exp,
        });
      }
    }
    return data;
  }, [allTransactions, cashflowOffset, cashflowViewMode]);

  const currentMonthLabel = useMemo(() => {
    return monthsList.find((m) => m.value === selectedMonthStr)?.label || "";
  }, [monthsList, selectedMonthStr]);

  const chronologicalMonths = useMemo(() => {
    return monthsList;
  }, [monthsList]);

  const activeIncomeCategories = useMemo(() => {
    return financeCategories
      .filter((c) => c.type === "INCOME" && c.isActive)
      .map((c) => c.name);
  }, [financeCategories]);

  const activeExpenseCategories = useMemo(() => {
    return financeCategories
      .filter((c) => c.type === "EXPENDITURE" && c.isActive)
      .map((c) => c.name);
  }, [financeCategories]);

  const budgetGridCategories = useMemo(() => {
    const set = new Set(activeExpenseCategories);
    allTransactions.forEach((t) => {
      if (t.type === "EXPENDITURE" || t.type === "INVESTMENT") {
        set.add(t.category);
      }
    });
    budgetCategories.forEach((b) => {
      set.add(b.category);
    });
    return Array.from(set);
  }, [activeExpenseCategories, allTransactions, budgetCategories]);

  const incomeCategories = useMemo(() => {
    const set = new Set(activeIncomeCategories);
    allTransactions.forEach((t) => {
      if (t.type === "INCOME") {
        set.add(t.category);
      }
    });
    return Array.from(set);
  }, [activeIncomeCategories, allTransactions]);

  const getBudgetForCategory = (categoryName: string) => {
    const match = budgetCategories.find(
      (b) =>
        b.category.toLowerCase() === categoryName.toLowerCase() &&
        b.year === currentMonthData.year &&
        b.month === currentMonthData.month,
    );
    return match ? match.amount : 0;
  };

  const getActualSpent = (category: string, year: number, month: number) => {
    return allTransactions
      .filter(
        (t) =>
          t.type === "EXPENDITURE" &&
          t.category.toLowerCase() === category.toLowerCase() &&
          t.date.getFullYear() === year &&
          t.date.getMonth() + 1 === month,
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetVal = (category: string, dbVal: number) => {
    if (tempBudgets[category] !== undefined) {
      return tempBudgets[category];
    }
    return dbVal === 0 ? "" : dbVal.toString();
  };

  // Format currency
  const formatCur = (amt: number) => "₹" + amt.toLocaleString("en-IN");

  // Handle Add Transaction Submit
  const handleAddTx = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      type: fd.get("type") as "INCOME" | "EXPENDITURE" | "INVESTMENT",
      category: fd.get("category") as string,
      amount: parseInt(fd.get("amount") as string, 10),
      date: fd.get("date") as string,
      description: fd.get("description") as string,
    };
    startTransition(async () => {
      if (repeatEveryMonth) {
        await addAutoPay({
          type: data.type,
          category: data.category,
          amount: data.amount,
          startDate: data.date,
          description: data.description,
        });
      } else {
        await addFinanceTransaction(data);
      }
      setShowAddTx(false);
    });
  };

  // Handle Set Budget Submit
  const handleSetBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      category: fd.get("category") as string,
      amount: parseInt(fd.get("amount") as string, 10),
      month: currentMonthData.month,
      year: currentMonthData.year,
    };
    startTransition(async () => {
      await setBudgetCategory(data);
      setShowSetBudget(false);
    });
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header (Subtitle removed) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
          Finance Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoPayRules(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all shadow-sm cursor-pointer"
          >
            <Repeat className="h-3.5 w-3.5 animate-spin-slow text-brand-orange-500" />
            Auto Pay
          </button>
          <button
            onClick={() => {
              setTxType("EXPENDITURE");
              setSelectedCategory("Rent");
              setCustomCategory("");
              setRepeatEveryMonth(false);
              setShowAddTx(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange-500 hover:bg-brand-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Tab Switcher (No outer card container, directly on page background) */}
      <div className="flex items-center justify-between py-2 border-b border-zinc-200/60 dark:border-zinc-800/40 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "transactions", label: "Transactions", icon: CreditCard },
            { id: "budget", label: "Budget", icon: PieChartIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-brand-orange-500/15 dark:bg-brand-orange-500/25 text-brand-orange-600 dark:text-brand-orange-400 border border-brand-orange-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <style>{`
          .stats-container {
            container-type: inline-size;
            width: 100%;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
          @container (min-width: 750px) {
            .stats-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }
        `}</style>
        {tabPending ? (
          activeTab === "overview" ? (
            <OverviewSkeleton />
          ) : activeTab === "transactions" ? (
            <TransactionsSkeleton />
          ) : (
            <BudgetSkeleton />
          )
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab
                monthsList={monthsList}
                selectedMonthStr={selectedMonthStr}
                setSelectedMonthStr={setSelectedMonthStr}
                currentMonthData={currentMonthData}
                insightsData={insightsData}
                cashflowOffset={cashflowOffset}
                setCashflowOffset={setCashflowOffset}
                cashflowViewMode={cashflowViewMode}
                setCashflowViewMode={setCashflowViewMode}
                formatCur={formatCur}
                COLORS={COLORS}
              />
            )}
            {activeTab === "transactions" && (
              <TransactionsTab
                txInMonth={currentMonthData.txInMonth}
                allTransactionsCount={allTransactions.length}
                formatCur={formatCur}
              />
            )}
            {activeTab === "budget" && (
              <BudgetTab
                chronologicalMonths={chronologicalMonths}
                selectedMonthStr={selectedMonthStr}
                currentMonthData={currentMonthData}
                budgetGridCategories={budgetGridCategories}
                budgetCategories={budgetCategories}
                editingCategory={editingCategory}
                getBudgetVal={getBudgetVal}
                setTempBudgets={setTempBudgets}
                handleSaveBudget={handleSaveBudget}
                handleCancelEdit={handleCancelEdit}
                handleStartEdit={handleStartEdit}
                getActualSpent={getActualSpent}
                setCategorySettingsTab={setCategorySettingsTab}
                openCategorySettings={openCategorySettings}
              />
            )}
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Add Manual Entry
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openCategorySettings}
                  className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shadow-sm"
                  title="Manage Categories"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-2">
                  Type
                </label>
                <input type="hidden" name="type" value={txType} />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "EXPENDITURE", label: "Expense" },
                    { value: "INVESTMENT", label: "Investment" },
                    { value: "INCOME", label: "Income" },
                  ].map((item) => {
                    const isSelected = txType === item.value;
                    let activeClass = "";
                    if (item.value === "INCOME") {
                      activeClass =
                        "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600/80 dark:border-emerald-600/80 shadow-sm";
                    } else if (item.value === "EXPENDITURE") {
                      activeClass =
                        "bg-brand-orange-500 text-white border-brand-orange-500 shadow-sm";
                    } else {
                      activeClass =
                        "bg-blue-600 text-white border-blue-600 dark:bg-blue-600/80 dark:border-blue-600/80 shadow-sm";
                    }
                    const inactiveClass =
                      "bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900";

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTxType(item.value as any)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected ? activeClass : inactiveClass
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  Category
                </label>
                <input
                  type="hidden"
                  name="category"
                  value={
                    selectedCategory === "Other"
                      ? customCategory
                      : selectedCategory
                  }
                />

                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto pr-1">
                  {(txType === "INCOME"
                    ? incomeCategories
                    : budgetGridCategories
                  ).map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                            : "bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("Other")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all cursor-pointer ${
                      selectedCategory === "Other"
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Other
                  </button>
                </div>

                {/* Custom Category Input */}
                {selectedCategory === "Other" && (
                  <input
                    type="text"
                    name="customCategory"
                    required
                    placeholder="Type custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  placeholder="1000"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Brief note..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="repeatEveryMonth"
                  name="repeatEveryMonth"
                  checked={repeatEveryMonth}
                  onChange={(e) => setRepeatEveryMonth(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-brand-orange-500 focus:ring-brand-orange-500 cursor-pointer h-4 w-4"
                />
                <label
                  htmlFor="repeatEveryMonth"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Repeat every month (Auto-Pay)
                </label>
              </div>
              <button
                disabled={isPending}
                type="submit"
                className="w-full rounded-xl bg-brand-orange-500 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-600 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isPending ? "Saving..." : "Save Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {showSetBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowSetBudget(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-2">Set Monthly Budget</h2>
            <p className="text-xs text-zinc-500 mb-6">
              Setting budget for {currentMonthData.month}/
              {currentMonthData.year}
            </p>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  required
                  placeholder="e.g. Rent, Marketing"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Budget Limit (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  placeholder="5000"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <button
                disabled={isPending}
                type="submit"
                className="w-full rounded-xl bg-zinc-900 dark:bg-white py-2.5 text-sm font-bold text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Set Budget"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Auto Pay Rules Modal */}
      {showAutoPayRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowAutoPayRules(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold mb-2">
              Manage Auto Pay Rules
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Edit or cancel active recurring payments. Modifications apply from
              the currently selected month onwards and preserve history.
            </p>

            <div className="overflow-x-auto max-h-[480px] min-h-[350px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Starts</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {autoPays.map((ap) => {
                    const isEditing = editingAutoPayId === ap.id;
                    const ruleStart = new Date(ap.startDate);
                    const ruleEnd = ap.endDate ? new Date(ap.endDate) : null;
                    const isActive = !ruleEnd;

                    return (
                      <tr
                        key={ap.id}
                        className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                      >
                        {isEditing ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editApCategory}
                                onChange={(e) =>
                                  setEditApCategory(e.target.value)
                                }
                                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-500">
                              {ap.type}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={editApAmount}
                                onChange={(e) =>
                                  setEditApAmount(e.target.value)
                                }
                                className="w-20 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold font-mono"
                              />
                            </td>
                            <td className="px-4 py-3 text-zinc-400">
                              {ruleStart.toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500">
                                Editing
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={async () => {
                                  startTransition(async () => {
                                    await editAutoPay({
                                      id: ap.id,
                                      category: editApCategory,
                                      amount: parseInt(editApAmount) || 0,
                                      effectiveFromMonthStr: selectedMonthStr,
                                    });
                                    setEditingAutoPayId(null);
                                  });
                                }}
                                className="px-2 py-1 rounded bg-brand-orange-500 text-white text-[10px] font-bold cursor-pointer hover:bg-brand-orange-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingAutoPayId(null)}
                                className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              <div>{ap.category}</div>
                              {ap.description && (
                                <div className="text-[10px] font-normal text-zinc-450 dark:text-zinc-500 mt-0.5">
                                  {ap.description}
                                </div>
                              )}
                            </td>
                            <td
                              className={`px-4 py-3 font-bold ${
                                ap.type === "INCOME"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ap.type === "INVESTMENT"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {ap.type}
                            </td>
                            <td className="px-4 py-3 font-bold font-mono text-zinc-700 dark:text-zinc-300">
                              {formatCur(ap.amount)}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-450">
                              {ruleStart.toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-zinc-500/10 text-zinc-400"
                                }`}
                              >
                                {isActive
                                  ? "Active"
                                  : `Ended ${ruleEnd?.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                              {isActive && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingAutoPayId(ap.id);
                                      setEditApCategory(ap.category);
                                      setEditApAmount(ap.amount.toString());
                                      setEditApDescription(
                                        ap.description || "",
                                      );
                                    }}
                                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          "Are you sure you want to stop this Auto-Pay starting from this month?",
                                        )
                                      ) {
                                        startTransition(async () => {
                                          await deleteAutoPay({
                                            id: ap.id,
                                            effectiveFromMonthStr:
                                              selectedMonthStr,
                                          });
                                        });
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-750 font-semibold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {autoPays.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-zinc-400"
                      >
                        No active auto-pay configurations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategorySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              {/* Tab Selector in the header */}
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCategorySettingsTab("EXPENDITURE")}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    categorySettingsTab === "EXPENDITURE"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850"
                  }`}
                >
                  Expense & Investment
                </button>
                <button
                  type="button"
                  onClick={() => setCategorySettingsTab("INCOME")}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    categorySettingsTab === "INCOME"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850"
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Close button aligned in the header row */}
              <button
                type="button"
                onClick={() => setShowCategorySettings(false)}
                className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Categories Spreadsheet Grid */}
            <div className="overflow-x-auto max-h-[480px] min-h-[350px] mb-6 rounded-xl p-1 bg-zinc-50/30 dark:bg-zinc-950/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-950/20">
                    <th className="py-2.5 px-4">Category Name</th>
                    {categorySettingsTab === "EXPENDITURE" && (
                      <th className="py-2.5 px-4 w-36">Budget (₹/Mo)</th>
                    )}
                    <th className="py-2.5 px-4 w-12 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {categoryDrafts
                    .filter(
                      (d) => d.type === categorySettingsTab && !d.isDeleted,
                    )
                    .map((draft) => (
                      <tr
                        key={draft.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10"
                      >
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) =>
                              updateDraftName(draft.id, e.target.value)
                            }
                            placeholder="e.g. Utilities, Salaries"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange-500 font-semibold"
                            required
                          />
                        </td>
                        {categorySettingsTab === "EXPENDITURE" && (
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={draft.budget}
                              onChange={(e) =>
                                updateDraftBudget(draft.id, e.target.value)
                              }
                              placeholder="Not Set"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange-500 font-mono font-bold"
                            />
                          </td>
                        )}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteDraftRow(draft.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer transition-colors"
                            title="Deactivate Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {categoryDrafts.filter(
                    (d) => d.type === categorySettingsTab && !d.isDeleted,
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={categorySettingsTab === "EXPENDITURE" ? 3 : 2}
                        className="py-8 text-center text-zinc-400"
                      >
                        No categories found. Click "Add Category" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions: Add Row & Save Changes */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={addDraftRow}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategorySettings(false)}
                  className="rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={saveAllCategoryChanges}
                  className="rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
