import React from "react";
import { Settings, Check, X, Pencil } from "lucide-react";

interface BudgetCategory {
  id?: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

interface BudgetTabProps {
  chronologicalMonths: { value: string; label: string; year: number; month: number }[];
  selectedMonthStr: string;
  currentMonthData: {
    month: number;
    year: number;
  };
  budgetGridCategories: string[];
  budgetCategories: BudgetCategory[];
  editingCategory: string | null;
  getBudgetVal: (cat: string, defAmt: number) => string;
  setTempBudgets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSaveBudget: (cat: string) => void;
  handleCancelEdit: (cat: string) => void;
  handleStartEdit: (cat: string, amt: number) => void;
  getActualSpent: (cat: string, y: number, m: number) => number;
  setCategorySettingsTab: (tab: "INCOME" | "EXPENDITURE") => void;
  openCategorySettings: () => void;
}

export default function BudgetTab({
  chronologicalMonths,
  selectedMonthStr,
  currentMonthData,
  budgetGridCategories,
  budgetCategories,
  editingCategory,
  getBudgetVal,
  setTempBudgets,
  handleSaveBudget,
  handleCancelEdit,
  handleStartEdit,
  getActualSpent,
  setCategorySettingsTab,
  openCategorySettings,
}: BudgetTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
          Budget vs Actual
        </h3>
        <button
          type="button"
          onClick={() => {
            setCategorySettingsTab("EXPENDITURE");
            openCategorySettings();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-sm"
        >
          <Settings className="h-3.5 w-3.5" />
          Edit Budgets
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-3 min-w-[150px]">Category</th>
              <th className="px-4 py-3 text-center min-w-[110px]">Budget/Mo</th>
              {chronologicalMonths.map((m) => {
                const isCurrent = m.value === selectedMonthStr;
                return (
                  <th
                    key={m.value}
                    className={`px-4 py-3 text-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-brand-orange-500/5 dark:bg-brand-orange-500/10 text-brand-orange-600 dark:text-brand-orange-400 font-bold"
                        : "text-zinc-450 dark:text-zinc-500"
                    } uppercase tracking-wider`}
                  >
                    {m.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-sm">
            {budgetGridCategories.map((cat) => {
              const currentBudget = budgetCategories.find(
                (b) =>
                  b.category.toLowerCase() === cat.toLowerCase() &&
                  b.month === currentMonthData.month &&
                  b.year === currentMonthData.year
              );
              const budgetAmount = currentBudget ? currentBudget.amount : 0;

              return (
                <tr
                  key={cat}
                  className="even:bg-zinc-50/20 dark:even:bg-zinc-800/5 hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors"
                >
                  <td className="px-4 py-4 font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    {cat}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {editingCategory === cat ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          placeholder="0"
                          autoFocus
                          value={getBudgetVal(cat, budgetAmount)}
                          onChange={(e) =>
                            setTempBudgets((prev) => ({
                              ...prev,
                              [cat]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveBudget(cat);
                            } else if (e.key === "Escape") {
                              handleCancelEdit(cat);
                            }
                          }}
                          className="w-20 px-2 py-1 text-center text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-orange-500 font-mono"
                        />
                        <button
                          onClick={() => handleSaveBudget(cat)}
                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-955/30 cursor-pointer"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(cat)}
                          className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 group/btn">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                          {budgetAmount > 0 ? (
                            `₹${budgetAmount.toLocaleString("en-IN")}`
                          ) : (
                            <span className="text-zinc-200 dark:text-zinc-800 font-normal">—</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleStartEdit(cat, budgetAmount)}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all opacity-0 group-hover/btn:opacity-100 focus:opacity-100"
                          title="Edit Budget"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  {chronologicalMonths.map((m) => {
                    const spentVal = getActualSpent(cat, m.year, m.month);
                    const isCurrent = m.value === selectedMonthStr;
                    return (
                      <td
                        key={m.value}
                        className={`px-4 py-4 text-center whitespace-nowrap ${
                          isCurrent ? "bg-brand-orange-500/5 dark:bg-brand-orange-500/10 font-bold" : ""
                        }`}
                      >
                        <div className="text-xs font-bold text-zinc-750 dark:text-zinc-300 font-mono">
                          {spentVal > 0 ? (
                            `₹${spentVal.toLocaleString("en-IN")}`
                          ) : (
                            <span className="text-zinc-200 dark:text-zinc-800 font-normal">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
