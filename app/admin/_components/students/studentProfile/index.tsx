"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Key, Bell } from "lucide-react";
import { MedicalNotesCard } from "./MedicalNotesCard";
import PushNotificationModal from "./PushNotificationModal";
import StudentStatusBadge from "../StudentStatusBadge";
import StudentAvatar from "../StudentAvatar";
import {
  formatAge,
  formatJoinedDate,
  formatTenure,
  type StudentStatus,
} from "@/lib/utils/student";
import type { PlanRow, AttendanceRow, PaymentRow } from "./types";
import { AttendanceCard } from "./AttendanceCard";
import { PlanCard } from "./PlanCard";
import { FreezePlanPopup } from "./FreezePlanPopup";
import { PlanHistory } from "./PlanHistory";
import { StudentLevel, AcademyProfile } from "@prisma/client";
import { LevelProgress } from "./LevelProgress";
import { PaymentHistory } from "./PaymentHistory";
import { getPaymentByIdAction } from "@/lib/actions/payments";
import { FeeReceipt } from "./FeeReceipt";
import StudentCredentialsModal from "./StudentCredentialsModal";
// ─── Student type ─────────────────────────────────────────────────────────────

type StudentData = {
  id: string;
  studentNumber: number;
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  level: StudentLevel;
  notes: string | null;
  medicalHistory: string | null;
  trainingFocus?: string | null;
  avatarUrl?: string | null;
  status: StudentStatus;
  activePlan: PlanRow | null;
  sessionsPending: number | null;
  plans: PlanRow[];
  attendances: AttendanceRow[];
  payments: PaymentRow[];
  password?: string | null;
  isTempPassword?: boolean;
  registrationFee?: number | null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentDetailClient({
  student,
  canManage,
  academyProfile,
}: {
  student: StudentData;
  canManage: boolean;
  academyProfile: AcademyProfile;
}) {
  const [showFreeze, setShowFreeze] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPushNotification, setShowPushNotification] = useState(false);

  const handlePrint = async (paymentId: string) => {
    try {
      const data = await getPaymentByIdAction(paymentId);
      if (data) {
        const student = data.student;
        const firstName = student.name.trim().split(/\s+/)[0]?.toLowerCase() || "student";
        const newTitle = `TAG${student.studentNumber}-${firstName}-fee-reciept`;
        document.title = newTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = newTitle;
        }
        setPrintData(data);
      } else {
        alert("Failed to load receipt data for printing");
      }
    } catch {
      alert("Error fetching receipt details");
    }
  };

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        const standardTitle = "TAG CRM · Academy of Gymnastics";
        document.title = standardTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
        setPrintData(null);
      }, 600);
      return () => {
        clearTimeout(timer);
        const standardTitle = "TAG CRM · Academy of Gymnastics";
        document.title = standardTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
      };
    }
  }, [printData]);
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="space-y-6 min-w-0">
      {/* Page title + action buttons */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-55 truncate">
            Student Profile
          </h1>
          <StudentStatusBadge status={student.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop view: inline buttons */}
          <div className="hidden min-[1025px]:flex items-center gap-2">
            {/* Admission Receipt */}
            {student.registrationFee && student.registrationFee > 0 ? (
              <a
                href={`/admin/students/${student.id}/admission-receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-350 visited:text-zinc-700 dark:visited:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
              >
                <svg
                  className="w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Admission Receipt
              </a>
            ) : null}

            {/* Print ID card */}
            <a
              href={`/admin/students/${student.id}/id-card`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-350 visited:text-zinc-700 dark:visited:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7"
                />
                <rect x="3" y="9" width="18" height="10" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 14h12M6 18h8"
                />
                <circle cx="18" cy="13" r="1" fill="currentColor" />
              </svg>
              Print ID
            </a>

            {/* Login Credentials */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowCredentials(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
              >
                <Key className="w-4 h-4 text-zinc-500" />
                Credentials
              </button>
            )}

            {/* Push Notification */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowPushNotification(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4 text-zinc-500" />
                Push Alert
              </button>
            )}

            {/* Freeze plan */}
            {canManage &&
              student.activePlan &&
              student.status !== "INACTIVE" &&
              student.status !== "NO_PLAN" &&
              student.status !== "EXPIRED" && (
                <button
                  type="button"
                  onClick={() => setShowFreeze(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
                >
                  <svg
                    className="w-4 h-4 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v18M3 12h18M12 9l-3-3M12 15l-3 3M12 9l3-3M12 15l3 3M9 12L6 9M15 12l3-3M9 12l-3 3M15 12l3 3"
                    />
                  </svg>
                  Freeze plan
                </button>
              )}

            {/* Edit details */}
            {canManage && (
              <a
                href={`/admin/students/${student.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z"
                  />
                </svg>
                Edit details
              </a>
            )}
          </div>

          {/* Mobile view: dropdown menu */}
          <div className="relative min-[1025px]:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
              aria-label="More actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xl py-1 z-50 origin-top-right animate-scale-in">
                {/* Edit details */}
                {canManage && (
                  <Link
                    href={`/admin/students/${student.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 visited:text-zinc-700 dark:visited:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left font-medium cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-500 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z"
                      />
                    </svg>
                    Edit details
                  </Link>
                )}

                {/* Freeze plan */}
                {canManage &&
                  student.activePlan &&
                  student.status !== "INACTIVE" &&
                  student.status !== "NO_PLAN" &&
                  student.status !== "EXPIRED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowFreeze(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left font-semibold cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-500 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 3v18M3 12h18M12 9l-3-3M12 15l-3 3M12 9l3-3M12 15l3 3M9 12L6 9M15 12l3-3M9 12l-3 3M15 12l3 3"
                        />
                      </svg>
                      Freeze plan
                    </button>
                  )}

                {/* Admission Receipt */}
                {student.registrationFee && student.registrationFee > 0 && (
                  <a
                    href={`/admin/students/${student.id}/admission-receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 visited:text-zinc-700 dark:visited:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left font-medium cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-500 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Admission Receipt
                  </a>
                )}

                {/* Print ID */}
                <a
                  href={`/admin/students/${student.id}/id-card`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 visited:text-zinc-700 dark:visited:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left font-medium cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-zinc-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9V2h12v7"
                    />
                    <rect x="3" y="9" width="18" height="10" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 14h12M6 18h8"
                    />
                    <circle cx="18" cy="13" r="1" fill="currentColor" />
                  </svg>
                  Print ID
                </a>

                {/* Login Credentials */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCredentials(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-zinc-500 shrink-0" />
                    Credentials
                  </button>
                )}

                {/* Push Notification */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPushNotification(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-zinc-500 shrink-0" />
                    Push Alert
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr] min-w-0">
        {/* ── Left column ── */}
        <div className="space-y-4 min-w-0">
          {/* Avatar + name card */}
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <StudentAvatar student={student} size={128} />
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-55">
                {student.name}
              </h2>
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                TAG{student.studentNumber}
              </p>
            </div>
          </div>

          {/* Student level progress */}
          <LevelProgress
            studentId={student.id}
            studentName={student.name}
            currentLevel={student.level}
            canManage={canManage}
          />

          {/* Basic info card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Age
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatAge(new Date(student.dateOfBirth))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Gender
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right capitalize">
                  {student.gender}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  DOB
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Parent
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {student.parentName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Phone
                </dt>
                <dd className="font-medium text-right">
                  <a
                    href={`tel:${student.contactNumber}`}
                    className="text-brand-orange-500 hover:underline"
                  >
                    {student.contactNumber}
                  </a>
                </dd>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Joined
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatJoinedDate(new Date(student.admissionDate))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  Tenure
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatTenure(new Date(student.admissionDate))}
                </dd>
              </div>
            </dl>
          </div>

          <MedicalNotesCard
            studentId={student.id}
            initialNotes={student.notes}
            initialMedicalHistory={student.medicalHistory}
            initialTrainingFocus={student.trainingFocus}
            canManage={canManage}
          />
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4 min-w-0">
          {!student.activePlan ? (
            /* No plan empty state */
            <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center text-center gap-5 py-16 px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <svg
                  className="w-8 h-8 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No plan created
                </h3>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-[240px]">
                  This student doesn&apos;t have an active plan yet.
                </p>
              </div>
              {canManage && (
                <Link
                  href={`/admin/plans?student=${student.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Create plan
                </Link>
              )}
            </div>
          ) : (
            <>
              <AttendanceCard
                attendances={student.attendances}
                activePlan={student.activePlan}
                allPlans={student.plans}
              />
              {/* CTA when plan has ended — let managers assign a fresh one */}
              {canManage &&
                (student.status === "INACTIVE" || student.status === "EXPIRED") && (
                  <div className="rounded-3xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-900/30 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 items-center justify-center text-rose-600 dark:text-rose-400">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-rose-950 dark:text-rose-200">
                          Plan has ended
                        </p>
                        <p className="text-xs text-rose-650 dark:text-rose-400/80 mt-0.5">
                          Assign a new plan to re-enroll this student.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/plans?student=${student.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-4.5 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Create new plan
                    </Link>
                  </div>
                )}
              <PlanCard
                plan={student.activePlan}
                sessionsPending={student.sessionsPending}
                status={student.status}
                student={student}
                canManage={canManage}
                setShowFreeze={setShowFreeze}
                academyProfile={academyProfile}
              />
            </>
          )}

          <PlanHistory plans={student.plans} />
          <PaymentHistory payments={student.payments} studentId={student.id} onPrint={handlePrint} />
        </div>
      </div>

      {/* Freeze popup */}
      {showFreeze && student.activePlan && (
        <FreezePlanPopup
          activePlan={student.activePlan}
          studentId={student.id}
          onClose={() => setShowFreeze(false)}
        />
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <StudentCredentialsModal
          isOpen={showCredentials}
          onClose={() => setShowCredentials(false)}
          studentId={student.id}
          studentNumber={student.studentNumber}
          studentName={student.name}
          parentPhoneNumber={student.contactNumber}
          hasPasswordSet={!!student.password}
          isTempPassword={!!student.isTempPassword}
        />
      )}

      {/* Push Notification Modal */}
      {showPushNotification && (
        <PushNotificationModal
          isOpen={showPushNotification}
          onClose={() => setShowPushNotification(false)}
          studentId={student.id}
          studentName={student.name}
        />
      )}

      {/* Print styles and hidden receipt container */}
      {printData && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @page {
              size: A4;
              margin: 0 !important;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                background: white !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-receipt-container,
              #print-receipt-container * {
                visibility: visible !important;
              }
              #print-receipt-container {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background: white !important;
                border: none !important;
              }
            }
          `}} />
          <div
            id="print-receipt-container"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 99999,
              backgroundColor: "white",
              display: "none",
            }}
          >
            <FeeReceipt data={printData} academyProfile={academyProfile} />
          </div>
        </>
      )}
    </div>
  );
}


