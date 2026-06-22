"use client";

import { useState, useRef, useEffect } from "react";
import { Search, User, ChevronDown, X } from "lucide-react";

export interface CoachOption {
  id: string;
  name: string;
  specialization: string | null;
  timing: string | null;
  status: "WORKING" | "LEFT";
  avatarUrl?: string | null;
  activeStudentCount?: number;
}

interface Props {
  coaches: CoachOption[];
  value: string; // selected coachId
  onChange: (id: string) => void;
  error?: string;
}

export default function CoachPicker({ coaches, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const workingCoaches = coaches.filter((c) => c.status === "WORKING");
  const selected = coaches.find((c) => c.id === value);

  const filtered = workingCoaches.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.specialization ?? "").toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const baseInputClass =
    "w-full rounded-2xl border bg-white dark:bg-zinc-900 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-400/60 transition-all";
  const borderClass = error
    ? "border-rose-400 dark:border-rose-500"
    : "border-zinc-200 dark:border-zinc-800";

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseInputClass} ${borderClass} flex items-center justify-between gap-2 cursor-pointer text-left`}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <img
              src={selected.avatarUrl || "/coach-profile-placeholder.webp"}
              alt={selected.name}
              className="h-7 w-7 shrink-0 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800"
            />
            <span className="truncate font-medium">{selected.name}</span>
            {selected.specialization && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate hidden sm:block">
                · {selected.specialization}
              </span>
            )}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">Select coach</span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onChange(""))}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </span>
      </button>

      {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {/* Modal Popup */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => { setOpen(false); setQuery(""); }}
          />

          {/* Modal box */}
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Select Coach</h3>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery(""); }}
                className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-850">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or specialization..."
                  className="w-full rounded-2xl border border-zinc-250 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 pl-9.5 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Coaches List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850">
              {filtered.length === 0 ? (
                <div className="px-4 py-12 text-center space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {workingCoaches.length === 0 ? "No coaches added yet" : "No matches found"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {workingCoaches.length === 0 ? "Add coaches first in the Coaches page" : "Try searching for a different name or specialization"}
                  </p>
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { onChange(c.id); setOpen(false); setQuery(""); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                      value === c.id ? "bg-brand-orange-50/50 dark:bg-brand-orange-950/10" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <img
                      src={c.avatarUrl || "/coach-profile-placeholder.webp"}
                      alt={c.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800"
                    />

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                          {c.name}
                        </span>
                        {c.timing && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                            · {c.timing}
                          </span>
                        )}
                      </div>
                      {c.specialization && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {c.specialization}
                        </p>
                      )}
                    </div>

                    {/* PT count & select mark */}
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-650 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-700/50">
                        {c.activeStudentCount ?? 0} active PT
                      </span>
                      {value === c.id ? (
                        <span className="h-5 w-5 rounded-full bg-brand-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth={3}>
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        </span>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-zinc-250 dark:border-zinc-700 shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
