import React from "react";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  date: Date;
  description: string;
}

interface TransactionsTabProps {
  txInMonth: Transaction[];
  allTransactionsCount: number;
  formatCur: (val: number) => string;
}

export default function TransactionsTab({
  txInMonth,
  allTransactionsCount,
  formatCur,
}: TransactionsTabProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-sm">
          {txInMonth.map((t) => (
            <tr
              key={t.id}
              className={
                t.type === "INCOME"
                  ? "bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                  : t.type === "INVESTMENT"
                    ? "bg-purple-50/25 dark:bg-purple-955/10 hover:bg-purple-50/50 dark:hover:bg-purple-955/20 transition-colors"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              }
            >
              <td className="px-6 py-3 font-medium text-xs text-zinc-650 dark:text-zinc-400">
                {t.date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-3 font-semibold text-zinc-850 dark:text-zinc-200 text-xs">
                {t.category}
              </td>
              <td className="px-6 py-3 text-xs text-zinc-500 max-w-[200px] truncate">
                {t.description}
              </td>
              <td
                className={`px-6 py-3 font-bold text-right whitespace-nowrap ${
                  t.type === "INCOME"
                    ? "text-emerald-650 dark:text-emerald-400"
                    : t.type === "INVESTMENT"
                      ? "text-purple-650 dark:text-purple-400"
                      : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCur(t.amount)}
              </td>
            </tr>
          ))}
          {allTransactionsCount === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
