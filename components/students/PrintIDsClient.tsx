"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  Search,
  Check,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { getStudentAvatarUrl } from "@/lib/utils/avatar";
import type { StudentStatus } from "@/lib/utils/student";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanInfo = {
  planType: string;
  expiryDate: Date | string;
  endDate: Date | string;
  batchId?: string | null;
  batch?: { id: string; name: string; timing: string } | null;
  isActive: boolean;
  sessionsCompleted: number;
  totalSessions: number;
  freezeStartDate?: Date | string | null;
  freezeEndDate?: Date | string | null;
  freezePeriods?: { startDate: Date | string; endDate: Date | string }[];
};

export type PrintStudent = {
  id: string;
  studentNumber: number;
  name: string;
  dateOfBirth: Date | string;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date | string;
  avatarUrl?: string | null;
  status: StudentStatus;
  activePlan: PlanInfo | null;
};

type Batch = { id: string; name: string; timing?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStudentId(num: number): string {
  return `TAG${String(num).padStart(3, "0")}`;
}

function isPlanEnded(plan: PlanInfo | null): boolean {
  if (!plan) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(plan.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return today > expiry;
}

// ─── Multi-Select Dropdown Component ──────────────────────────────────────────

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: Set<T>;
  onChange: (value: T) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonText = selected.size === 0 
    ? placeholder 
    : selected.size === options.length
    ? "All selected"
    : options
        .filter((o) => selected.has(o.value))
        .map((o) => o.label)
        .join(", ");

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 text-left select-none border-zinc-200 dark:border-zinc-800"
      >
        <span className="truncate pr-2">{buttonText}</span>
        <svg className={`w-4 h-4 text-zinc-450 dark:text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1.5 max-h-56 overflow-y-auto z-40 space-y-0.5">
          {options.map((opt) => {
            const isSelected = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between"
              >
                <span className="truncate pr-2">{opt.label}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  isSelected 
                    ? "bg-brand-orange-500 border-brand-orange-500 text-white" 
                    : "border-zinc-300 dark:border-zinc-700"
                }`}>
                  {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={4} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Single ID card (front) ───────────────────────────────────────────────────

function IDCardFront({
  student,
  qrDataUrl,
}: {
  student: PrintStudent;
  qrDataUrl: string;
}) {
  const avatarUrl = getStudentAvatarUrl({
    id: student.id,
    name: student.name,
    studentNumber: student.studentNumber,
    avatarUrl: student.avatarUrl,
    gender: student.gender,
  });

  const { firstName, lastName } = useMemo(() => {
    const parts = student.name.trim().split(/\s+/);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
  }, [student.name]);

  const dobText = useMemo(
    () =>
      new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [student.dateOfBirth]
  );

  return (
    <div className="id-card-wrap-print relative overflow-hidden bg-white select-none shrink-0">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/Id-card/front-graphic.webp" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Logo */}
      <div className="absolute top-[1.4em] left-[1.6em] z-10 w-[3.2em] h-[3.2em]">
        <img src="/logo.webp" alt="TAG Logo" className="w-full h-full object-contain" />
      </div>

      {/* Photo */}
      <div className="absolute top-[6.8em] right-[3.2em] z-10 w-[7.4em] h-[7.4em]">
        <div className="w-full h-full rounded-full p-[0.18em] bg-[#f05a22] shadow-lg">
          <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 relative">
            <img src={avatarUrl} alt={student.name} className="w-full h-full object-cover object-center" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="absolute top-[13.4em] left-[1.6em] right-[1.6em] z-10 flex flex-col gap-[0.7em]">
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[1.25em] font-black text-zinc-955 uppercase tracking-wide break-words">{firstName}</span>
          {lastName && (
            <span className="text-[1.25em] font-black text-[#f05a22] uppercase tracking-wide break-words">{lastName}</span>
          )}
          <span className="text-[0.55em] font-bold tracking-[0.2em] text-zinc-500 mt-[0.3em] uppercase">Student</span>
        </div>
        <div className="flex flex-col gap-[0.3em]">
          {[
            ["ID No.", formatStudentId(student.studentNumber)],
            ["Parent", student.parentName],
            ["Contact", student.contactNumber],
            ["DOB", dobText],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center text-[0.58em] font-bold text-zinc-800">
              <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">{label}</span>
              <span className="text-zinc-400 mr-[0.5em] font-medium">:</span>
              <span className="text-zinc-955 font-black truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div className="absolute bottom-[1.8em] left-[1.6em] border-l-[0.15em] border-[#f05a22] pl-[0.5em] text-left leading-[1.1] z-10">
        <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">Focus.</p>
        <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">Practice.</p>
        <p className="text-[0.52em] font-black text-[#f05a22] uppercase tracking-wider">Achieve.</p>
      </div>

      {/* QR */}
      <div className="absolute bottom-[1.5em] right-[1.6em] z-10">
        <div className="w-[4.7em] h-[4.7em]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-zinc-200 rounded" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single ID card (back) ────────────────────────────────────────────────────

function IDCardBack({
  qrDataUrl,
  academyProfile,
}: {
  qrDataUrl: string;
  academyProfile: {
    email: string | null;
    phone: string | null;
    phone2: string | null;
    address: string | null;
    website?: string | null;
  };
}) {
  return (
    <div className="id-card-wrap-print relative overflow-hidden bg-zinc-955 select-none shrink-0">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/Id-card/back-graphic.webp" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Dark Logo */}
      <div className="absolute top-[2.5em] left-1/2 -translate-x-1/2 z-10 w-[5.9em] h-[3.5em]">
        <img src="/Id-card/dark-logo.webp" alt="TAG Dark Logo" className="w-full h-full object-contain" />
      </div>

      {/* Slogan */}
      <div className="absolute top-[6.0em] left-0 right-0 text-center w-full z-10 uppercase tracking-wider font-black leading-tight">
        <p className="text-[0.60em] text-white">Empowering Athletes.</p>
        <p className="text-[0.60em] text-[#f05a22]">Building Champions.</p>
      </div>

      {/* QR */}
      <div className="absolute top-[8.8em] left-1/2 -translate-x-1/2 z-10">
        <div className="w-[8.0em] h-[8.0em]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-zinc-200" />
          )}
        </div>
      </div>

      {/* Contact & Address info (relocated to dark area) */}
      <div className="absolute top-[18.0em] left-[1.8em] right-[1.8em] text-left z-10 flex flex-col gap-[0.45em]">
        {/* Row 1: Address */}
        <div className="flex items-start gap-[0.4em] w-full">
          <svg className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0 mt-[0.05em]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[0.48em] font-extrabold text-white leading-normal">
            {(academyProfile.address || "Office No 7, 2nd floor, Nine Hills Plaza\nopposite Tribeca High street NIBM Annexe\nPune 411060").replace(/\n/g, " , ")}
          </span>
        </div>
        {/* Row 2: Phone */}
        <div className="flex items-center gap-[0.4em]">
          <svg className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          <span className="text-[0.48em] font-extrabold text-white leading-none tracking-wider">
            {academyProfile.phone && academyProfile.phone2
              ? `${academyProfile.phone} / ${academyProfile.phone2}`
              : academyProfile.phone || academyProfile.phone2 || "7977177463 / 7757965651"}
          </span>
        </div>
        {/* Row 3: Email */}
        {academyProfile.email && (
          <div className="flex items-center gap-[0.4em]">
            <svg className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[0.48em] font-extrabold text-white leading-none lowercase">
              {academyProfile.email}
            </span>
          </div>
        )}
        {/* Row 4: Website */}
        {academyProfile.website && (
          <div className="flex items-center gap-[0.4em]">
            <svg className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-[0.48em] font-extrabold text-white leading-none lowercase">
              {academyProfile.website}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer Strip: Terms & Conditions relocated as para */}
      <div className="absolute bottom-[1.4em] left-0 right-0 z-10 flex flex-col items-center justify-center px-[1.6em]">
        <p className="text-[0.48em] font-extrabold text-zinc-700 leading-[1.3] text-center max-w-[92%]">
          * Property of The Academy of Gymnastics. Must be displayed on premises. Non-transferable. If found, return to the nearest TAG center.
        </p>
      </div>
    </div>
  );
}

// ─── Student selection row ─────────────────────────────────────────────────────

function StudentRow({
  student,
  selected,
  onToggle,
}: {
  student: PrintStudent;
  selected: boolean;
  onToggle: () => void;
}) {
  const statusColors: Record<StudentStatus, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    GRACE: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    FREEZE: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400",
    INACTIVE: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
    EXPIRED: "bg-zinc-100 text-zinc-550 dark:bg-zinc-800 dark:text-zinc-455",
    NO_PLAN: "bg-zinc-100 text-zinc-550 dark:bg-zinc-800 dark:text-zinc-450",
  };

  const planEnded = isPlanEnded(student.activePlan);

  return (
    <label
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all border ${
        selected
          ? "border-brand-orange-500 bg-brand-orange-50/40 dark:bg-brand-orange-950/10 dark:border-brand-orange-500/20"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      }`}
    >
      {/* Custom checkbox */}
      <div
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          selected
            ? "bg-brand-orange-500 border-brand-orange-500"
            : "border-zinc-300 dark:border-zinc-600"
        }`}
        onClick={onToggle}
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>

      {/* Avatar */}
      <div
        className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700"
        onClick={onToggle}
      >
        <img
          src={getStudentAvatarUrl({
            id: student.id,
            name: student.name,
            studentNumber: student.studentNumber,
            avatarUrl: student.avatarUrl,
            gender: student.gender,
          })}
          alt={student.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{student.name}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{formatStudentId(student.studentNumber)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[student.status]}`}>
            {student.status.replace("_", " ")}
          </span>
          {student.activePlan?.batch?.name && (
            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate">
              {student.activePlan.batch.name}
            </span>
          )}
          {planEnded && (
            <span className="text-[10px] font-semibold text-rose-500">Plan ended</span>
          )}
        </div>
      </div>
    </label>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function PrintIDsClient({
  students,
  batches,
  academyProfile,
}: {
  students: PrintStudent[];
  batches: Batch[];
  academyProfile: {
    email: string | null;
    phone: string | null;
    phone2: string | null;
    address: string | null;
    website?: string | null;
  };
}) {
  // ── Filter states ──────────────────────────────────────────────────────────
  const [statusFilters, setStatusFilters] = useState<Set<StudentStatus>>(new Set());
  const [batchFilters, setBatchFilters] = useState<Set<string>>(new Set());
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("ALL");
  const [planEndedFilter, setPlanEndedFilter] = useState<"ALL" | "ACTIVE" | "ENDED">("ACTIVE");
  const [search, setSearch] = useState("");

  // ── Selection states ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Print options ──────────────────────────────────────────────────────────
  const [printBack, setPrintBack] = useState(true);

  // ── QR cache ──────────────────────────────────────────────────────────────
  const [qrMap, setQrMap] = useState<Map<string, { front: string; back: string }>>(new Map());
  const [qrLoading, setQrLoading] = useState(false);

  // Toast notification state (info during QR generation)
  const [toast, setToast] = useState<null | { type: 'info' | 'success' | 'error'; message: string }>(null);


  // ── Print state ─────────────────────────────────────────────────────────────
  const [isPrintMode, setIsPrintMode] = useState(false);

  // ── Filtered students ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentNumber.toString().startsWith(q)
      );
    }

    if (statusFilters.size > 0) {
      rows = rows.filter((s) => statusFilters.has(s.status));
    }

    if (batchFilters.size > 0) {
      rows = rows.filter((s) => {
        const studentBatchId = s.activePlan?.batchId || "UNASSIGNED";
        return batchFilters.has(studentBatchId);
      });
    }

    if (planTypeFilter !== "ALL") {
      rows = rows.filter((s) => s.activePlan?.planType === planTypeFilter);
    }

    if (planEndedFilter === "ACTIVE") {
      rows = rows.filter((s) => !isPlanEnded(s.activePlan));
    } else if (planEndedFilter === "ENDED") {
      rows = rows.filter((s) => isPlanEnded(s.activePlan));
    }

    return rows;
  }, [students, search, statusFilters, batchFilters, planTypeFilter, planEndedFilter]);

  // ── Auto-select when filter changes ───────────────────────────────────────
  useEffect(() => {
    setSelectedIds(new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedIds.has(s.id));
  }, [students, selectedIds]);
  // ── QR refs & progress ────────────────────────────────────────────────────
  // Live ref so polling closures always read the latest map
  const qrMapRef = useRef(qrMap);
  useEffect(() => { qrMapRef.current = qrMap; }, [qrMap]);

  // Progress counter (driven by chunked generation loop)
  const [qrProgress, setQrProgress] = useState({ done: 0, total: 0 });


  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const someFilteredSelected = filtered.some((s) => selectedIds.has(s.id));

  // ── Preview states ──────────────────────────────────────────────────────────
  const previewStudent = useMemo(() => {
    return students.find((s) => selectedIds.has(s.id)) || filtered[0] || students[0] || null;
  }, [selectedIds, filtered, students]);

  const [previewQr, setPreviewQr] = useState<{ front: string; back: string } | null>(null);

  useEffect(() => {
    if (!previewStudent) {
      setPreviewQr(null);
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/students/${previewStudent.id}`;
    
    let active = true;
    Promise.all([
      QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }),
      QRCode.toDataURL(url, { margin: 1, width: 300, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }),
    ]).then(([front, back]) => {
      if (active) {
        setPreviewQr({ front, back });
      }
    }).catch((err) => console.error("Error generating preview QR:", err));
    
    return () => {
      active = false;
    };
  }, [previewStudent?.id]);

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generateQRCodes() {
    if (selectedStudents.length === 0) return new Map<string, { front: string; back: string }>();

    // Students whose QR codes are not yet in the cache
    const missing = selectedStudents.filter((s) => !qrMapRef.current.has(s.id));
    if (missing.length === 0) return qrMapRef.current;

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    setQrLoading(true);
    setQrProgress({ done: 0, total: missing.length });
    setToast({ type: "info", message: "Generating QR codes…" });

    // Process one at a time, yielding between each so the UI stays responsive
    for (let i = 0; i < missing.length; i++) {
      const s = missing[i];
      const url = `${origin}/students/${s.id}`;
      try {
        const [front, back] = await Promise.all([
          QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }),
          QRCode.toDataURL(url, { margin: 1, width: 300, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }),
        ]);
        setQrMap((prev) => {
          const next = new Map(prev);
          next.set(s.id, { front, back });
          qrMapRef.current = next;
          return next;
        });
      } catch (err) {
        console.error("QR generation failed for", s.id, err);
      }
      // Update progress counter after each student
      setQrProgress({ done: i + 1, total: missing.length });
      // Yield to the browser so the UI can repaint
      await new Promise<void>((r) => setTimeout(r, 0));
    }

    setQrLoading(false);
    setToast(null);
    setQrProgress({ done: 0, total: 0 });
    return qrMapRef.current;
  }

  async function handlePrint() {
    const map = await generateQRCodes();
    if (!map || map.size === 0) return;

    setIsPrintMode(true);
    setToast({ type: "info", message: "Preparing print layout…" });

    // Wait for React to flush the portal to the DOM, then wait for every
    // image inside #print-root to finish loading before opening the dialog.
    await new Promise<void>((resolve) => {
      // rAF → next paint → then start polling
      requestAnimationFrame(() => {
        const waitForImages = () => {
          const root = document.getElementById("print-root");
          if (!root) { setTimeout(waitForImages, 50); return; }

          const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
          const allLoaded = imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);

          if (allLoaded) {
            resolve();
          } else {
            // Attach load/error handlers on any still-pending images
            const pending = imgs.filter((img) => !img.complete);
            let settled = 0;
            const onSettle = () => { settled++; if (settled >= pending.length) resolve(); };
            pending.forEach((img) => {
              img.addEventListener("load", onSettle, { once: true });
              img.addEventListener("error", onSettle, { once: true });
            });
            // Safety timeout — never block the user forever
            setTimeout(resolve, 8000);
          }
        };
        waitForImages();
      });
    });

    setToast(null);
    window.print();
    setTimeout(() => setIsPrintMode(false), 500);
  }

  const hasFilters =
    statusFilters.size > 0 ||
    batchFilters.size > 0 ||
    planTypeFilter !== "ALL" ||
    planEndedFilter !== "ALL";

  function clearFilters() {
    setStatusFilters(new Set());
    setBatchFilters(new Set());
    setPlanTypeFilter("ALL");
    setPlanEndedFilter("ACTIVE");
    setSearch("");
  }

  // ── Options mappings ───────────────────────────────────────────────────────
  const statusOptions = [
    { value: "ACTIVE" as StudentStatus, label: "Active" },
    { value: "GRACE" as StudentStatus, label: "Grace" },
    { value: "FREEZE" as StudentStatus, label: "Freeze" },
    { value: "INACTIVE" as StudentStatus, label: "Inactive" },
    { value: "EXPIRED" as StudentStatus, label: "Expired" },
    { value: "NO_PLAN" as StudentStatus, label: "No plan" },
  ];

  const batchOptions = useMemo(() => {
    return [
      { value: "UNASSIGNED", label: "No batch assigned" },
      ...batches.map((b) => ({ value: b.id, label: `${b.name} ${b.timing ? `(${b.timing})` : ""}` })),
    ];
  }, [batches]);

  function toggleStatusFilter(status: StudentStatus) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleBatchFilter(batchId: string) {
    setBatchFilters((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 min-w-0">
      <style dangerouslySetInnerHTML={{ __html: printStyles(printBack) }} />

      {/* ── Toast + Progress bar (bottom of screen) ── */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm animate-fade-in">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl px-4 pt-3.5 pb-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-brand-orange-500 animate-spin shrink-0" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 flex-1">
                {qrProgress.total > 0
                  ? `Generating QR codes… ${qrProgress.done} / ${qrProgress.total}`
                  : 'Generating QR codes… please wait'}
              </p>
            </div>
            {/* Progress bar */}
            {qrProgress.total > 0 && (
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-orange-500 transition-all duration-300"
                  style={{ width: `${Math.round((qrProgress.done / qrProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">Print ID Cards</h1>
          </div>
        </div>

        {/* Right: primary action button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={selectedStudents.length === 0 || qrLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-semibold transition-all shadow-md shadow-brand-orange-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            {qrLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {qrLoading
              ? "Generating…"
              : `Print ID Cards ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}`}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Preview & Filters sidebar ── */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Options & Filters panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                Options &amp; Filters
              </h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Card Options */}
            <div className="space-y-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Print Back Side</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Include back design of card</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintBack(!printBack)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
                    printBack ? "bg-brand-orange-500" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      printBack ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Plan Ended */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Plan Status
              </label>
              <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-0.5 gap-0.5">
                {(
                  [
                    { val: "ACTIVE", label: "Active" },
                    { val: "ALL", label: "All" },
                    { val: "ENDED", label: "Ended" },
                  ] as const
                ).map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPlanEndedFilter(val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      planEndedFilter === val
                        ? "bg-brand-orange-500 text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statuses (Multi-select) */}
            <MultiSelectDropdown
              label="Student Statuses"
              options={statusOptions}
              selected={statusFilters}
              onChange={toggleStatusFilter}
              placeholder="All statuses"
            />

            {/* Batches (Multi-select) */}
            <MultiSelectDropdown
              label="Batches"
              options={batchOptions}
              selected={batchFilters}
              onChange={toggleBatchFilter}
              placeholder="All batches"
            />

            {/* Plan type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Plan Type
              </label>
              <select
                value={planTypeFilter}
                onChange={(e) => setPlanTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-305 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
              >
                <option value="ALL">All plans</option>
                <option value="REGULAR">Group class</option>
                <option value="ONE_TO_ONE">Personal training</option>
              </select>
            </div>

            {/* Summary */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Showing</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{filtered.length} students</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Selected</span>
                <span className="font-bold text-brand-orange-500">{selectedStudents.length} to print</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Cards per student</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{printBack ? "2 (front + back)" : "1 (front only)"}</span>
              </div>
            </div>
          </div>

          {/* Live ID Card Preview */}
          {previewStudent && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                ID Card Preview
              </h2>
              
              <div 
                className="id-card-preview-container flex flex-row justify-center gap-3 w-full py-2"
                style={{ fontSize: printBack ? "6.8px" : "12px" }}
              >
                <IDCardFront student={previewStudent} qrDataUrl={previewQr?.front || ""} />
                {printBack && <IDCardBack qrDataUrl={previewQr?.back || ""} academyProfile={academyProfile} />}
              </div>
            </div>
          )}
        </aside>

        {/* ── Right: Student grid ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search + select all bar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              {/* Select all checkbox */}
              <button
                type="button"
                onClick={toggleAll}
                title={allFilteredSelected ? "Deselect all" : "Select all"}
                className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                  allFilteredSelected
                    ? "bg-brand-orange-500 border-brand-orange-500"
                    : someFilteredSelected
                    ? "bg-brand-orange-200 dark:bg-brand-orange-900 border-brand-orange-400"
                    : "border-zinc-300 dark:border-zinc-650 hover:border-brand-orange-400"
                }`}
              >
                {allFilteredSelected ? (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                ) : someFilteredSelected ? (
                  <span className="w-2.5 h-0.5 bg-brand-orange-600 dark:bg-brand-orange-300 block rounded-full" />
                ) : null}
              </button>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="search"
                  placeholder="Search by name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                />
              </div>

              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                {selectedIds.size} / {students.length}
              </span>
            </div>
          </div>

          {/* Student Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 py-16 text-center">
              <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No students match your filters</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-xs text-brand-orange-500 hover:text-brand-orange-600 font-semibold cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  selected={selectedIds.has(s.id)}
                  onToggle={() => toggleStudent(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {isPrintMode && typeof window !== "undefined" && document.body && createPortal(
        <div id="print-root" className="print-root">
          {selectedStudents.map((student) => {
            const qr = qrMap.get(student.id) ?? { front: "", back: "" };
            return (
              <div key={student.id} className="card-pair">
                <IDCardFront student={student} qrDataUrl={qr.front} />
                {printBack && <IDCardBack qrDataUrl={qr.back} academyProfile={academyProfile} />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Print CSS ─────────────────────────────────────────────────────────────────

function printStyles(printBack: boolean): string {
  return `
    .id-card-wrap-print {
      font-family: 'Inter', system-ui, sans-serif;
      width: 18.75em;
      height: 29.734em;
      font-size: 16px;
      position: relative;
      overflow: hidden;
      border-radius: 1.5em;
      box-shadow: 0 4px 32px rgba(0,0,0,0.18);
    }

    .id-card-preview-container .id-card-wrap-print {
      font-size: inherit !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      border: 1px solid rgba(0,0,0,0.05) !important;
    }

    .print-root {
      display: none;
    }

    @media print {
      body > *:not(#print-root) {
        display: none !important;
      }

      #print-root {
        display: block !important;
      }

      @page {
        size: A4 portrait;
        margin: 8mm;
      }

      .print-root {
        display: block !important;
      }

      .card-pair {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: flex-start;
        gap: 8mm;
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 6mm;
      }

      .id-card-wrap-print {
        width: 53.98mm !important;
        height: 85.60mm !important;
        font-size: 2.8789mm !important;
        box-shadow: none !important;
        border-radius: 3mm !important;
        border: none !important;
        background: white !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}
