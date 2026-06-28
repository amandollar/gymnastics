
"use client";

import { useMemo, useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { resolveTemplate, getEffectiveTemplate } from "@/lib/utils/whatsapp-templates";
import AddEnquiryModal from "@/app/admin/_components/enquiries/AddEnquiryModal";
import EditEnquiryModal from "@/app/admin/_components/enquiries/EditEnquiryModal";
import WhatsAppModal from "@/app/admin/_components/common/WhatsAppModal";
import { useRouter } from "next/navigation";
import EnquiryStatusBadge from "./EnquiryStatusBadge";
import type { EnquiryStatus } from "@prisma/client";
import {
  deleteEnquiryAction,
  updateEnquiryStatusAction,
} from "@/lib/actions/enquiries";
import { Plus, UserPlus } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

export type EnquiryListItem = {
  id: string;
  enquiryNumber: number;
  childName: string;
  childAge: number | null;
  gender: string | null;
  parentName: string;
  contactNumber: string;
  source: string | null;
  interestedIn: string | null;
  status: EnquiryStatus;
  notes: string | null;
  followUpDate: Date | null;
  convertedToId: string | null;
  createdAt: Date;
};

// Source display labels mapping
const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  OTHER: "Other",
};

function getWhatsAppCleanUrl(contactNumber: string, messageText: string) {
  let cleanNumber = contactNumber.replace(/\D/g, "");
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
}

// ─── Row Menu Dropdown ─────────────────────────────────────────────────────────

function RowMenu({
  enquiry,
  canManage,
  onDelete,
  onStatusChange,
  isMutating,
  onWhatsAppFollowUp,
  onEditClick,
}: {
  enquiry: EnquiryListItem;
  canManage: boolean;
  onDelete: () => void;
  onStatusChange: (status: EnquiryStatus) => void;
  isMutating: boolean;
  onWhatsAppFollowUp: (enquiry: EnquiryListItem) => void;
  onEditClick: (enquiry: EnquiryListItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const itemClass =
    "flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer disabled:opacity-50";

  const convertUrl = `/students/new?childName=${encodeURIComponent(
    enquiry.childName,
  )}&parentName=${encodeURIComponent(
    enquiry.parentName,
  )}&contactNumber=${encodeURIComponent(
    enquiry.contactNumber,
  )}${enquiry.gender ? `&gender=${encodeURIComponent(enquiry.gender)}` : ""}${
    enquiry.childAge ? `&childAge=${enquiry.childAge}` : ""
  }`;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        id={`enquiry-menu-${enquiry.id}`}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={isMutating}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <nav
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            top: coords.top,
            right: coords.right,
            zIndex: 9999,
          }}
          className="w-56 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1 overflow-hidden animate-menu-show"
        >
          {/* Edit */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEditClick(enquiry);
              }}
              className={itemClass}
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
            </button>
          )}

          {/* WhatsApp Follow-up */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onWhatsAppFollowUp(enquiry);
            }}
            className={itemClass}
          >
            <svg
              className="w-4 h-4 text-emerald-500 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
            </svg>
            WhatsApp Follow up
          </button>

          {/* Convert to Student */}
          {canManage && enquiry.status !== "CONVERTED" && (
            <Link
              href={convertUrl}
              prefetch={false}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <svg
                className="w-4 h-4 text-brand-orange-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Convert to Student
            </Link>
          )}

          {/* Quick status updates */}
          {canManage && (
            <>
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Quick status change
              </div>
              {(
                [
                  "NEW",
                  "CONTACTED",
                  "FOLLOW_UP",
                  "CONVERTED",
                  "LOST",
                ] as EnquiryStatus[]
              ).map((status) => {
                if (status === enquiry.status) return null;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onStatusChange(status);
                    }}
                    className={itemClass}
                  >
                    <span
                      className="h-2 w-2 rounded-full bg-current shrink-0"
                      style={{
                        color:
                          status === "NEW"
                            ? "#3b82f6"
                            : status === "CONTACTED"
                              ? "#f59e0b"
                              : status === "FOLLOW_UP"
                                ? "#a855f7"
                                : status === "CONVERTED"
                                  ? "#10b981"
                                  : "#71717a",
                      }}
                    />
                    Mark as{" "}
                    {status === "FOLLOW_UP"
                      ? "Follow-up"
                      : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </>
          )}

          {/* Delete */}
          {canManage && (
            <>
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className={`${itemClass} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Enquiry
              </button>
            </>
          )}
        </nav>
      )}
    </>
  );
}

// ─── Main list page component ───────────────────────────────────────────────────

export default function EnquiryListClient({
  enquiries,
  canManage,
  academyProfile,
}: {
  enquiries: EnquiryListItem[];
  canManage: boolean;
  academyProfile?: any;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "ALL">(
    "ALL",
  );
  const [isPending, startTransition] = useTransition();

  const [followUpEnquiry, setFollowUpEnquiry] = useState<EnquiryListItem | null>(null);
  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const triggerWhatsAppFollowUp = (enquiry: EnquiryListItem) => {
    const template = getEffectiveTemplate(academyProfile?.templateEnquiryFollowUp, "templateEnquiryFollowUp");
    const text = resolveTemplate(template, {
      parentName: enquiry.parentName,
      studentName: enquiry.childName,
      planType: enquiry.interestedIn || "gymnastics",
    });
    setFollowUpEnquiry(enquiry);
    setMessageText(text);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageText((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setMessageText(before + emoji + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === "NEW").length;
    const contactedCount = enquiries.filter(
      (e) => e.status === "CONTACTED",
    ).length;
    const followUpCount = enquiries.filter(
      (e) => e.status === "FOLLOW_UP",
    ).length;
    const convertedCount = enquiries.filter(
      (e) => e.status === "CONVERTED",
    ).length;
    const lostCount = enquiries.filter((e) => e.status === "LOST").length;
    return {
      total,
      new: newCount,
      contacted: contactedCount,
      followUp: followUpCount,
      converted: convertedCount,
      lost: lostCount,
    };
  }, [enquiries]);

  const pieData = useMemo(() => {
    return [
      { name: "New", value: stats.new, color: "#3b82f6" },
      { name: "Contacted", value: stats.contacted, color: "#f59e0b" },
      { name: "Follow-up", value: stats.followUp, color: "#a855f7" },
      { name: "Converted", value: stats.converted, color: "#10b981" },
      { name: "Lost", value: stats.lost, color: "#71717a" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Clientside filtering & sorting (newest to oldest by default)
  const filtered = useMemo(() => {
    let rows = [...enquiries];
    rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.childName.toLowerCase().includes(q) ||
          e.parentName.toLowerCase().includes(q) ||
          e.contactNumber.includes(q) ||
          String(e.enquiryNumber).includes(q),
      );
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((e) => e.status === statusFilter);
    }
    return rows;
  }, [enquiries, search, statusFilter]);

  // Date formatting helpers
  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Actions
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      startTransition(async () => {
        const res = await deleteEnquiryAction(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.message || "Failed to delete enquiry");
        }
      });
    }
  };

  const handleStatusChange = (id: string, status: EnquiryStatus) => {
    startTransition(async () => {
      const res = await updateEnquiryStatusAction(id, status);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message || "Failed to update status");
      }
    });
  };

  const total = stats.total;
  const newPercent = total > 0 ? Math.round((stats.new / total) * 100) : 0;
  const contactedPercent =
    total > 0 ? Math.round((stats.contacted / total) * 100) : 0;
  const followUpPercent =
    total > 0 ? Math.round((stats.followUp / total) * 100) : 0;
  const convertedPercent =
    total > 0 ? Math.round((stats.converted / total) * 100) : 0;
  const lostPercent = total > 0 ? Math.round((stats.lost / total) * 100) : 0;

  const [showAddEnquiry, setShowAddEnquiry] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<EnquiryListItem | null>(
    null,
  );

  return (
    <div className="space-y-4 min-w-0">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col gap-4 pt-1 pb-1.5 mb-2">
        {/* Header Row 1: Title & Action Button */}
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
              Enquiries
            </h1>
          </div>
          {canManage && (
            <div>
              <button
                onClick={() => setShowAddEnquiry(true)}
                className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add enquiry
              </button>
            </div>
          )}
        </div>

        {/* Header Row 2: Pill Bar and Search box */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pt-3 pb-2 sm:pt-6 sm:pb-3">
          {/* Desktop progress bar view (>= 425px) */}
          <div className="flex xs-hide flex-col gap-2.5 w-full max-w-md shrink-0">
            {total === 0 ? (
              <div className="h-[30px] sm:h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full">
                No enquiries
              </div>
            ) : (
              <div className="relative h-[30px] sm:h-10 w-full rounded-full flex bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 gap-0.5">
                {stats.new > 0 && (
                  <div
                    className="group relative h-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${newPercent}%` }}
                  >
                    {newPercent >= 10 ? `${newPercent}%` : ""}
                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-48 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-blue-600 dark:text-blue-500">
                        New
                      </span>
                      {stats.new} enquiries not yet processed.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
                {stats.contacted > 0 && (
                  <div
                    className="group relative h-full bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${contactedPercent}%` }}
                  >
                    {contactedPercent >= 10 ? `${contactedPercent}%` : ""}
                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-48 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-amber-600 dark:text-amber-500">
                        Contacted
                      </span>
                      {stats.contacted} enquiries contacted.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
                {stats.followUp > 0 && (
                  <div
                    className="group relative h-full bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${followUpPercent}%` }}
                  >
                    {followUpPercent >= 10 ? `${followUpPercent}%` : ""}
                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-48 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-purple-600 dark:text-purple-500">
                        Follow-up
                      </span>
                      {stats.followUp} enquiries requiring follow-up.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
                {stats.converted > 0 && (
                  <div
                    className="group relative h-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${convertedPercent}%` }}
                  >
                    {convertedPercent >= 10 ? `${convertedPercent}%` : ""}
                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-48 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-emerald-600 dark:text-emerald-500">
                        Converted
                      </span>
                      {stats.converted} enquiries converted to students.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
                {stats.lost > 0 && (
                  <div
                    className="group relative h-full bg-zinc-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${lostPercent}%` }}
                  >
                    {lostPercent >= 10 ? `${lostPercent}%` : ""}
                    {/* Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-48 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-zinc-500">
                        Lost
                      </span>
                      {stats.lost} enquiries marked as lost.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Labels Row */}
            <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1.5 px-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500" />
                <span>new ({stats.new})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-500" />
                <span>contacted ({stats.contacted})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-500" />
                <span>follow-up ({stats.followUp})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                <span>converted ({stats.converted})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>lost ({stats.lost})</span>
              </div>
            </div>
          </div>

          {/* Mobile Pie Chart view (< 425px) */}
          {total > 0 && (
            <div className="hidden xs-only-flex items-center justify-center gap-8 py-2 w-full">
              {/* Pie Chart */}
              <div className="w-[80px] h-[80px] shrink-0 flex items-center justify-center">
                <PieChart width={80} height={80}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={36}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* Labels list on the right (1 or 2 items per row) */}
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                  <span>new ({stats.new})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-500 shrink-0" />
                  <span>contacted ({stats.contacted})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-500 shrink-0" />
                  <span>follow ({stats.followUp})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
                  <span>conv ({stats.converted})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                  <span>lost ({stats.lost})</span>
                </div>
              </div>
            </div>
          )}

          {/* Right Part: Search Box */}
          <div className="relative w-full md:max-w-xs xl:max-w-sm">
            <input
              type="search"
              placeholder="Search name, parent, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filter Pills Row (Horizontally Scrollable) ─────────────────── */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 mb-2">
        <div className="flex items-center gap-1.5 pb-2 min-w-max">
          {(
            [
              { label: "All", value: "ALL" },
              { label: "New", value: "NEW" },
              { label: "Contacted", value: "CONTACTED" },
              { label: "Follow-up", value: "FOLLOW_UP" },
              { label: "Converted", value: "CONVERTED" },
              { label: "Lost", value: "LOST" },
            ] as const
          ).map((pill) => {
            const isActive = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-10">
            No enquiries found.
          </p>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    #{e.enquiryNumber} {e.childName}
                  </p>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">
                    {e.childAge ? `${e.childAge} yrs` : ""}
                    {e.childAge && e.gender ? " · " : ""}
                    {e.gender || ""}
                    {e.childAge || e.gender ? " · " : ""}
                    Parent: {e.parentName}
                  </p>
                </div>
                <EnquiryStatusBadge status={e.status} />
              </div>

              <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <p>Contact: {e.contactNumber}</p>
                {e.source && (
                  <p>Source: {SOURCE_LABELS[e.source] || e.source}</p>
                )}
                {e.followUpDate && (
                  <p className="text-brand-orange-500 font-medium">
                    Follow-up: {formatDate(e.followUpDate)}
                  </p>
                )}
                {e.notes && (
                  <p className="text-zinc-500 dark:text-zinc-500 italic line-clamp-2 mt-1">
                    &ldquo;{e.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                {canManage && e.status !== "CONVERTED" && (
                  <Link
                    href={`/admin/students/new?childName=${encodeURIComponent(
                      e.childName,
                    )}&parentName=${encodeURIComponent(
                      e.parentName,
                    )}&contactNumber=${encodeURIComponent(
                      e.contactNumber,
                    )}${e.gender ? `&gender=${encodeURIComponent(e.gender)}` : ""}${
                      e.childAge ? `&childAge=${e.childAge}` : ""
                    }`}
                    prefetch={false}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-brand-orange-500 hover:bg-brand-orange-50 dark:hover:bg-brand-orange-950/20 transition-colors"
                  >
                    Convert
                  </Link>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setEditingEnquiry(e)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => triggerWhatsAppFollowUp(e)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                >
                  WhatsApp
                </button>
                <RowMenu
                  enquiry={e}
                  canManage={canManage}
                  onDelete={() => handleDelete(e.id)}
                  onStatusChange={(status) => handleStatusChange(e.id, status)}
                  isMutating={isPending}
                  onWhatsAppFollowUp={triggerWhatsAppFollowUp}
                  onEditClick={setEditingEnquiry}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-lg border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left text-sm min-w-[1050px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No enquiries found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (
                      target.closest(
                        'a, button, select, input, [data-prevent-row-click="true"]',
                      )
                    ) {
                      return;
                    }
                    if (canManage) {
                      setEditingEnquiry(e);
                    }
                  }}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {e.enquiryNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {e.childName}
                    </div>
                    {(e.childAge || e.gender) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
                        {e.childAge ? `${e.childAge} yrs` : ""}
                        {e.childAge && e.gender ? " · " : ""}
                        {e.gender || ""}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.parentName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {e.contactNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {e.source ? SOURCE_LABELS[e.source] || e.source : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <EnquiryStatusBadge status={e.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-650 dark:text-zinc-350 font-medium">
                    {e.followUpDate ? (
                      <span className="text-brand-orange-500">
                        {formatDate(e.followUpDate)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatDate(e.createdAt)}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3"
                    data-prevent-row-click="true"
                  >
                    <div className="flex items-center justify-end gap-1 shrink-0">
                      {/* Convert Quick button */}
                      {canManage && e.status !== "CONVERTED" && (
                        <Link
                          href={`/admin/students/new?childName=${encodeURIComponent(
                            e.childName,
                          )}&parentName=${encodeURIComponent(
                            e.parentName,
                          )}&contactNumber=${encodeURIComponent(
                            e.contactNumber,
                          )}${e.gender ? `&gender=${encodeURIComponent(e.gender)}` : ""}${
                            e.childAge ? `&childAge=${e.childAge}` : ""
                          }`}
                          prefetch={false}
                          title="Convert to student"
                          className="shrink-0"
                        >
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-orange-500 hover:text-brand-orange-600 hover:bg-brand-orange-50 dark:hover:bg-brand-orange-950/20 transition-colors cursor-pointer">
                            <UserPlus className="w-4 h-4" />
                          </span>
                        </Link>
                      )}

                      {/* WhatsApp Follow-up */}
                      <button
                        type="button"
                        onClick={() => triggerWhatsAppFollowUp(e)}
                        title="Follow up on WhatsApp"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer shrink-0"
                      >
                        <svg
                          className="w-4.5 h-4.5 shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                        </svg>
                      </button>

                      <RowMenu
                        enquiry={e}
                        canManage={canManage}
                        onDelete={() => handleDelete(e.id)}
                        onStatusChange={(status) =>
                          handleStatusChange(e.id, status)
                        }
                        isMutating={isPending}
                        onWhatsAppFollowUp={triggerWhatsAppFollowUp}
                        onEditClick={setEditingEnquiry}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* WhatsApp Custom Modal */}
      <WhatsAppModal
        isOpen={!!followUpEnquiry}
        onClose={() => setFollowUpEnquiry(null)}
        contactNumber={followUpEnquiry?.contactNumber || ""}
        defaultMessageText={messageText}
        title="Follow up with WhatsApp"
        enquiryId={followUpEnquiry?.id}
        templateName="Enquiry Follow-up"
      />

      {/* Add Enquiry Popup Modal */}
      <AddEnquiryModal
        isOpen={showAddEnquiry}
        onClose={() => setShowAddEnquiry(false)}
      />

      {/* Edit Enquiry Popup Modal */}
      <EditEnquiryModal
        isOpen={!!editingEnquiry}
        onClose={() => setEditingEnquiry(null)}
        enquiry={editingEnquiry}
      />
    </div>
  );
}
