"use client";

import { useMemo, useState } from "react";
import { toDateInputValue } from "@/lib/utils/student";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function splitYmd(ymd: string | undefined) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return { day: "", month: "", year: "" };
  }
  const [year, month, day] = ymd.split("-");
  return { day, month, year };
}

function isValidYmd(ymd: string, maxYmd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = ymd.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) {
    return false;
  }
  return ymd <= maxYmd;
}

/**
 * Day / month / year dropdowns for date of birth — easier than scrolling
 * a native date picker back many years.
 */
export default function DateOfBirthField({
  name = "dateOfBirth",
  defaultValue,
  maxDate = toDateInputValue(new Date()),
  selectClassName,
  error,
}: {
  name?: string;
  defaultValue?: string;
  maxDate?: string;
  selectClassName: string;
  error?: string;
}) {
  const initial = splitYmd(defaultValue);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const maxYear = Number(maxDate.slice(0, 4));
  const minYear = maxYear - 30;

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [maxYear, minYear]);

  const maxDays = useMemo(() => {
    if (!month || !year) return 31;
    return daysInMonth(Number(year), Number(month));
  }, [month, year]);

  const hiddenValue = useMemo(() => {
    if (!day || !month || !year) return "";
    const d = day.padStart(2, "0");
    return `${year}-${month}-${d}`;
  }, [day, month, year]);

  const localError = useMemo(() => {
    if (!hiddenValue) return undefined;
    if (!isValidYmd(hiddenValue, maxDate)) {
      return "Please choose a valid date of birth (not in the future)";
    }
    return undefined;
  }, [hiddenValue, maxDate]);

  const displayError = error || localError;

  return (
    <div className="space-y-1.5">
      <input
        type="hidden"
        name={name}
        value={hiddenValue}
        readOnly
        aria-hidden
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="sr-only">Day</span>
          <select
            required
            aria-label="Day of birth"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={selectClassName}
          >
            <option value="">Day</option>
            {Array.from({ length: maxDays }, (_, i) => {
              const v = String(i + 1).padStart(2, "0");
              return (
                <option key={v} value={v}>
                  {i + 1}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <span className="sr-only">Month</span>
          <select
            required
            aria-label="Month of birth"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              if (day && Number(day) > daysInMonth(Number(year || maxYear), Number(e.target.value))) {
                setDay("");
              }
            }}
            className={selectClassName}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="sr-only">Year</span>
          <select
            required
            aria-label="Year of birth"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              if (
                day &&
                month &&
                Number(day) > daysInMonth(Number(e.target.value), Number(month))
              ) {
                setDay("");
              }
            }}
            className={selectClassName}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Pick day, month, and year — no calendar scrolling.
      </p>
      {displayError && (
        <p className="text-xs text-rose-600">{displayError}</p>
      )}
    </div>
  );
}
