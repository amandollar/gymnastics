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
      className="bg-[#121212] border border-zinc-800/60 overflow-hidden shadow-2xl relative"
      style={{ borderRadius: "2rem" }}
    >
      <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] p-5 pb-3">
        Payment History
      </h2>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider bg-[#18181a] border-b border-zinc-800/50">
              <th className="px-5 py-3 text-left">Invoice No.</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Plan details</th>
              <th className="px-5 py-3 text-left">Method</th>
              <th className="px-5 py-3 text-left">Amount</th>
              <th className="px-5 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {payments.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-[#18181a]/40 transition-colors"
              >
                <td className="px-5 py-3 font-bold text-white">
                  #{String(p.invoiceNumber).padStart(3, "0")}
                </td>
                <td className="px-5 py-3 text-xs text-zinc-400">
                  {new Date(p.paidAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-xs">
                  <span className="capitalize font-semibold text-zinc-300 block">
                    {p.studentPlan.planType === "ONE_TO_ONE"
                      ? "Personal training"
                      : "Group class"}
                  </span>
                  {p.studentPlan.planMonths && (
                    <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">
                      {p.studentPlan.planMonths} Months plan
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs capitalize text-zinc-400">
                  {p.method === "BANK_TRANSFER" ? "Bank Transfer" : p.method.toLowerCase()}
                </td>
                <td className="px-5 py-3 font-bold text-white">
                  {formatINR(p.amount)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onPrint(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#18181a] hover:bg-[#202022] text-zinc-300 hover:text-white transition-all border border-zinc-850 hover:border-brand-orange-500/50 cursor-pointer"
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
      <div className="block sm:hidden space-y-3 px-4 pb-5">
        {payments.map((p) => (
          <div
            key={p.id}
            className="bg-[#18181a] border border-zinc-800/40 rounded-2xl p-4 space-y-3.5 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">
                Invoice #{String(p.invoiceNumber).padStart(3, "0")}
              </span>
              <button
                onClick={() => onPrint(p.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-[#242426] hover:bg-[#2c2c2f] text-zinc-300 hover:text-white transition-all border border-zinc-800 hover:border-brand-orange-500/50 cursor-pointer"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest block mb-0.5">
                  Date
                </span>
                <span className="font-semibold text-zinc-300">
                  {new Date(p.paidAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest block mb-0.5">
                  Amount
                </span>
                <span className="font-extrabold text-white">
                  {formatINR(p.amount)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest block mb-0.5">
                  Details
                </span>
                <span className="text-zinc-300 font-semibold capitalize">
                  {p.studentPlan.planType === "ONE_TO_ONE" ? "Personal" : "Group"}{" "}
                  {p.studentPlan.planMonths ? `(${p.studentPlan.planMonths} Months)` : ""} · via {p.method === "BANK_TRANSFER" ? "Bank Transfer" : p.method.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
