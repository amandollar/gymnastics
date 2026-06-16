import { formatINR, toDateInputValue } from "@/lib/utils/student";
import type { PlanRow } from "./types";

// ─── Plan History ─────────────────────────────────────────────────────────────

export function PlanHistory({ plans }: { plans: PlanRow[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider p-5 pb-3">
        Plan History
      </h2>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60">
              <th className="px-5 py-2.5 text-left">Type</th>
              <th className="px-5 py-2.5 text-left">Period</th>
              <th className="px-5 py-2.5 text-left">Sessions</th>
              <th className="px-5 py-2.5 text-left">Fee</th>
              <th className="px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {plans.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="px-5 py-3 capitalize">
                  {p.planType === "ONE_TO_ONE" ? "personal" : "grouped"}
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500">
                  {toDateInputValue(new Date(p.startDate))} → {toDateInputValue(new Date(p.endDate))}
                </td>
                <td className="px-5 py-3">
                  {p.sessionsCompleted}/{p.totalSessions}
                </td>
                <td className="px-5 py-3">{formatINR(p.fee)}</td>
                <td className="px-5 py-3">
                  {p.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-xs">Archived</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {plans.map((p) => (
          <div
            key={p.id}
            className="p-4 space-y-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange-50 dark:bg-brand-orange-950/40 text-brand-orange-700 dark:text-brand-orange-400 uppercase tracking-wider">
                {p.planType === "ONE_TO_ONE" ? "personal" : "grouped"}
              </span>
              {p.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              ) : (
                <span className="text-zinc-400 text-xs font-medium">Archived</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Period
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {toDateInputValue(new Date(p.startDate))} → {toDateInputValue(new Date(p.endDate))}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Sessions
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {p.sessionsCompleted} / {p.totalSessions}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Fee
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatINR(p.fee)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
