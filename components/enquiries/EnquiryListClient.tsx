"use client";

import { useMemo, useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EnquiryStatusBadge from "./EnquiryStatusBadge";
import type { EnquiryStatus } from "@prisma/client";
import { deleteEnquiryAction, updateEnquiryStatusAction } from "@/lib/actions/enquiries";

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

function getWhatsAppUrl(contactNumber: string, childName: string) {
  let cleanNumber = contactNumber.replace(/\D/g, "");
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }
  const text = `Hello! This is TAG Academy. We are following up on your enquiry for ${childName}. Please let us know if you have any questions!`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

// ─── Row Menu Dropdown ─────────────────────────────────────────────────────────

function RowMenu({
  enquiry,
  canManage,
  onDelete,
  onStatusChange,
  isMutating,
}: {
  enquiry: EnquiryListItem;
  canManage: boolean;
  onDelete: () => void;
  onStatusChange: (status: EnquiryStatus) => void;
  isMutating: boolean;
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
    enquiry.childName
  )}&parentName=${encodeURIComponent(
    enquiry.parentName
  )}&contactNumber=${encodeURIComponent(
    enquiry.contactNumber
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
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: coords.top, right: coords.right, zIndex: 9999 }}
          className="w-56 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1 overflow-hidden"
        >
          {/* Edit */}
          {canManage && (
            <Link
              href={`/enquiries/${enquiry.id}/edit`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
              </svg>
              Edit details
            </Link>
          )}

          {/* WhatsApp Follow-up */}
          <a
            href={getWhatsAppUrl(enquiry.contactNumber, enquiry.childName)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
            </svg>
            WhatsApp Follow up
          </a>

          {/* Convert to Student */}
          {canManage && enquiry.status !== "CONVERTED" && (
            <Link
              href={convertUrl}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-brand-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
              {(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"] as EnquiryStatus[]).map((status) => {
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
                    <span className="h-2 w-2 rounded-full bg-current shrink-0" style={{
                      color:
                        status === "NEW" ? "#3b82f6" :
                        status === "CONTACTED" ? "#f59e0b" :
                        status === "FOLLOW_UP" ? "#a855f7" :
                        status === "CONVERTED" ? "#10b981" : "#71717a"
                    }} />
                    Mark as {status === "FOLLOW_UP" ? "Follow-up" : status.charAt(0) + status.slice(1).toLowerCase()}
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
                className={`${itemClass} text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Enquiry
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Main list page component ───────────────────────────────────────────────────

export default function EnquiryListClient({
  enquiries,
  canManage,
}: {
  enquiries: EnquiryListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "ALL">("ALL");
  const [isPending, startTransition] = useTransition();

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: enquiries.length,
      new: enquiries.filter((e) => e.status === "NEW").length,
      followUp: enquiries.filter((e) => e.status === "FOLLOW_UP").length,
      converted: enquiries.filter((e) => e.status === "CONVERTED").length,
    };
  }, [enquiries]);

  // Clientside filtering
  const filtered = useMemo(() => {
    let rows = enquiries;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.childName.toLowerCase().includes(q) ||
          e.parentName.toLowerCase().includes(q) ||
          e.contactNumber.includes(q) ||
          String(e.enquiryNumber).includes(q)
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

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Enquiries
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {stats.total} total · {stats.new} new · {stats.followUp} follow-up · {stats.converted} converted
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href="/enquiries/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors"
            >
              Add enquiry
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search name, parent, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | "ALL")}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        >
          <option value="ALL">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="FOLLOW_UP">Follow-up</option>
          <option value="CONVERTED">Converted</option>
          <option value="LOST">Lost</option>
        </select>
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
                    {(e.childAge || e.gender) ? " · " : ""}
                    Parent: {e.parentName}
                  </p>
                </div>
                <EnquiryStatusBadge status={e.status} />
              </div>

              <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <p>Contact: {e.contactNumber}</p>
                {e.source && <p>Source: {SOURCE_LABELS[e.source] || e.source}</p>}
                {e.followUpDate && (
                  <p className="text-brand-orange-500 font-medium">
                    Follow-up: {formatDate(e.followUpDate)}
                  </p>
                )}
                {e.notes && (
                  <p className="text-zinc-500 dark:text-zinc-500 italic line-clamp-2 mt-1">
                    "{e.notes}"
                  </p>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                {canManage && e.status !== "CONVERTED" && (
                  <Link
                    href={`/students/new?childName=${encodeURIComponent(
                      e.childName
                    )}&parentName=${encodeURIComponent(
                      e.parentName
                    )}&contactNumber=${encodeURIComponent(
                      e.contactNumber
                    )}${e.gender ? `&gender=${encodeURIComponent(e.gender)}` : ""}${
                      e.childAge ? `&childAge=${e.childAge}` : ""
                    }`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-brand-orange-500 hover:bg-brand-orange-50 dark:hover:bg-brand-orange-950/20 transition-colors"
                  >
                    Convert
                  </Link>
                )}
                {canManage && (
                  <Link
                    href={`/enquiries/${e.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Edit
                  </Link>
                )}
                <a
                  href={getWhatsAppUrl(e.contactNumber, e.childName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                >
                  WhatsApp
                </a>
                <RowMenu
                  enquiry={e}
                  canManage={canManage}
                  onDelete={() => handleDelete(e.id)}
                  onStatusChange={(status) => handleStatusChange(e.id, status)}
                  isMutating={isPending}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-lg border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('a, button, select, input, [data-prevent-row-click="true"]')) {
                      return;
                    }
                    if (canManage) {
                      router.push(`/enquiries/${e.id}/edit`);
                    }
                  }}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {e.enquiryNumber}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.parentName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {e.contactNumber}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {e.source ? SOURCE_LABELS[e.source] || e.source : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EnquiryStatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-650 dark:text-zinc-350 font-medium">
                    {e.followUpDate ? (
                      <span className="text-brand-orange-500">{formatDate(e.followUpDate)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-3" data-prevent-row-click="true">
                    <div className="flex items-center justify-end gap-1">
                      {/* Convert Quick button */}
                      {canManage && e.status !== "CONVERTED" && (
                        <Link
                          href={`/students/new?childName=${encodeURIComponent(
                            e.childName
                          )}&parentName=${encodeURIComponent(
                            e.parentName
                          )}&contactNumber=${encodeURIComponent(
                            e.contactNumber
                          )}${e.gender ? `&gender=${encodeURIComponent(e.gender)}` : ""}${
                            e.childAge ? `&childAge=${e.childAge}` : ""
                          }`}
                          title="Convert to student"
                          className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-semibold text-brand-orange-500 hover:bg-brand-orange-50 dark:hover:bg-brand-orange-950/20 transition-colors"
                        >
                          Convert
                        </Link>
                      )}

                      {/* Edit */}
                      {canManage && (
                        <Link
                          href={`/enquiries/${e.id}/edit`}
                          title="Edit enquiry"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
                          </svg>
                        </Link>
                      )}

                      {/* WhatsApp Follow-up */}
                      <a
                        href={getWhatsAppUrl(e.contactNumber, e.childName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Follow up on WhatsApp"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-605 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                        </svg>
                      </a>

                      {/* Row Menu */}
                      <RowMenu
                        enquiry={e}
                        canManage={canManage}
                        onDelete={() => handleDelete(e.id)}
                        onStatusChange={(status) => handleStatusChange(e.id, status)}
                        isMutating={isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
