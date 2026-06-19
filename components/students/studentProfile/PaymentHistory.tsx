import { formatINR } from "@/lib/utils/student";
import type { PaymentRow } from "./types";
import { Printer } from "lucide-react";

export function PaymentHistory({
  payments,
  onPrint,
}: {
  payments: PaymentRow[];
  studentId: string;
  onPrint: (paymentId: string) => void;
}) {
  if (!payments || payments.length === 0) return null;

  return (
    <div
      className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 overflow-hidden"
      style={{ borderRadius: "1.5rem" }}
    >
      <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider p-5 pb-3">
        Payment History
      </h2>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60">
              <th className="px-5 py-2.5 text-left">Invoice No.</th>
              <th className="px-5 py-2.5 text-left">Date</th>
              <th className="px-5 py-2.5 text-left">Plan details</th>
              <th className="px-5 py-2.5 text-left">Method</th>
              <th className="px-5 py-2.5 text-left">Amount</th>
              <th className="px-5 py-2.5 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {payments.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-5 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                  #{String(p.invoiceNumber).padStart(3, "0")}
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500">
                  {new Date(p.paidAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-xs">
                  <span className="capitalize font-medium block">
                    {p.studentPlan.planType === "ONE_TO_ONE"
                      ? "Personal training"
                      : "Group class"}
                  </span>
                  {p.studentPlan.planMonths && (
                    <span className="text-[10px] text-zinc-400">
                      {p.studentPlan.planMonths} Months plan
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs capitalize text-zinc-500">
                  {p.method === "BANK_TRANSFER" ? "Bank Transfer" : p.method.toLowerCase()}
                </td>
                <td className="px-5 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                  {formatINR(p.amount)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onPrint(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-100 dark:border-zinc-800 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {payments.map((p) => (
          <div
            key={p.id}
            className="p-4 space-y-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-850 dark:text-zinc-200">
                Invoice #{String(p.invoiceNumber).padStart(3, "0")}
              </span>
              <button
                onClick={() => onPrint(p.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-50 dark:bg-zinc-850 text-zinc-655 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800 cursor-pointer"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Date
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {new Date(p.paidAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Amount
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {formatINR(p.amount)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Details
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {p.studentPlan.planType === "ONE_TO_ONE" ? "Personal" : "Group"}{" "}
                  {p.studentPlan.planMonths ? `(${p.studentPlan.planMonths} Months)` : ""} · via {p.method}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
