"use client";

import { Clock, Users } from "lucide-react";
import type { BatchWithCount } from "@/lib/services/batches";

export default function BatchPicker({
  batches = [],
  value,
  onChange,
  error,
  onManageBatches,
}: {
  batches?: BatchWithCount[];
  value: string;
  onChange: (batchId: string) => void;
  error?: string;
  onManageBatches?: () => void;
}) {
  return (
    <div className="space-y-2.5">
      {batches.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {batches.map((b) => {
            const selected = b.id === value;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange(b.id)}
                className={`
                  relative flex flex-col gap-1.5 rounded-2xl border px-4 py-3.5 text-left transition-all cursor-pointer
                  ${
                    selected
                      ? "border-brand-orange-500 bg-brand-orange-50/60 dark:bg-brand-orange-950/20"
                      : "border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  }
                `}
                aria-pressed={selected}
              >
                {/* Selection indicator */}
                <span
                  className={`absolute top-3 right-3 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected
                      ? "border-brand-orange-500 bg-brand-orange-500"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>

                <p
                  className={`text-sm font-semibold pr-6 leading-snug ${
                    selected
                      ? "text-brand-orange-700 dark:text-brand-orange-300"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {b.name}
                </p>
                <div className="flex flex-col gap-1.5 mt-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selected ? "text-brand-orange-500" : "text-zinc-400"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        selected
                          ? "text-brand-orange-600 dark:text-brand-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {b.timing}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selected ? "text-brand-orange-500" : "text-zinc-400"
                      }`}
                    />
                    <div
                      className={`text-xs flex items-center gap-1.5 flex-wrap ${
                        selected
                          ? "text-brand-orange-600 dark:text-brand-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.activeCount ?? 0}
                      </span>
                      <span className="opacity-90">active</span>
                      <span className="opacity-30 select-none">|</span>
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.graceCount ?? 0}
                      </span>
                      <span className="opacity-90">grace</span>
                      <span className="opacity-30 select-none">|</span>
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.inactiveCount ?? 0}
                      </span>
                      <span className="opacity-90">inactive</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <span className="inline-block h-3.5 w-3.5 rounded-full border border-rose-500 flex items-center justify-center text-[9px] font-bold shrink-0">
            !
          </span>
          {error}
        </p>
      )}

      {/* Manage link — shown only when there are batches */}
      {batches.length > 0 && onManageBatches && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onManageBatches}
            className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Manage batches →
          </button>
        </div>
      )}
    </div>
  );
}
