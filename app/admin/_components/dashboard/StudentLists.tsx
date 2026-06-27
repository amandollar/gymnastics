"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Calendar, Check, Copy, MoreVertical } from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import type { DashboardStudent } from "@/lib/services/dashboard";

interface StudentListsProps {
  graceStudents: DashboardStudent[];
  inactiveStudents: DashboardStudent[];
  openWhatsappModal: (student: DashboardStudent, e: React.MouseEvent, isGrace: boolean) => void;
}

export default function StudentLists({
  graceStudents,
  inactiveStudents,
  openWhatsappModal,
}: StudentListsProps) {
  const router = useRouter();
  const [graceSortOrder, setGraceSortOrder] = useState<"latest" | "oldest">("latest");
  const [inactiveSortOrder, setInactiveSortOrder] = useState<"latest" | "oldest">("latest");
   const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [activeMenuStudentId, setActiveMenuStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenuStudentId) return;
    const handleOutsideClick = () => {
      setActiveMenuStudentId(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [activeMenuStudentId]);

  const sortedGraceStudents = useMemo(() => {
    const list = [...graceStudents];
    return list.sort((a, b) => {
      const dateA = new Date(a.statusEntryDate).getTime();
      const dateB = new Date(b.statusEntryDate).getTime();
      return graceSortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }, [graceStudents, graceSortOrder]);

  const sortedInactiveStudents = useMemo(() => {
    const list = [...inactiveStudents];
    return list.sort((a, b) => {
      const dateA = new Date(a.statusEntryDate).getTime();
      const dateB = new Date(b.statusEntryDate).getTime();
      return inactiveSortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }, [inactiveStudents, inactiveSortOrder]);

  const handleCopy = async (id: string, contactNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(contactNumber);
      setCopiedStudentId(id);
      setTimeout(() => setCopiedStudentId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2 min-w-0">
      {/* Grace Period Students Card */}
      <div className="rounded-3xl border border-zinc-100/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 pt-5 px-3 sm:px-5 pb-0 shadow-xs flex flex-col h-[380px] transition-all duration-300">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider">
              Grace Period
            </h3>
            <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {sortedGraceStudents.length}
            </span>
          </div>
          
          <button
            onClick={() => setGraceSortOrder(prev => prev === "latest" ? "oldest" : "latest")}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
          >
            {graceSortOrder === "latest" ? (
              <>
                <span>Latest</span>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            ) : (
              <>
                <span>Oldest</span>
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-0 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {sortedGraceStudents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
              No students in grace period
            </div>
          ) : (
            sortedGraceStudents.map((student) => {
              return (
                <div
                  key={student.id}
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                  className="flex items-center justify-between py-3 px-0 sm:px-3 rounded-2xl bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200 cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar student={student} size={40} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-brand-orange-500 dark:group-hover:text-brand-orange-500 transition-colors">
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                        <span>TAG{String(student.studentNumber).padStart(3, "0")}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>{student.sessionsCompleted}/{student.totalSessions}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 relative">
                    {/* Clickable Phone Number + Copy Container (only on screens >= 1440px) */}
                    <div
                      onClick={(e) => handleCopy(student.id, student.contactNumber, e)}
                      className="hidden min-[1440px]:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-550 hover:text-zinc-855 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Click to copy phone number"
                    >
                      <span className="text-xs font-semibold">
                        {student.contactNumber}
                      </span>
                      {copiedStudentId === student.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsappModal(student, e, true);
                      }}
                      className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 transition-colors cursor-pointer border-0 shrink-0 active:scale-95"
                      title="Send WhatsApp message"
                    >
                      <svg
                        className="w-4.5 h-4.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                      </svg>
                    </button>

                    {/* Actions Dropdown (hidden on screens >= 1440px) */}
                    <div className="relative min-[1440px]:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuStudentId(activeMenuStudentId === student.id ? null : student.id);
                        }}
                        className="h-8 w-8 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors border-0 cursor-pointer active:scale-95"
                        title="More actions"
                      >
                        <MoreVertical className="h-4.5 w-4.5 shrink-0" />
                      </button>

                      {activeMenuStudentId === student.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 z-50 animate-menu-show"
                        >
                          {/* Phone Number Header */}
                          <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/60 mb-1 select-text tracking-wider font-mono">
                            {student.contactNumber}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              handleCopy(student.id, student.contactNumber, e);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-2 cursor-pointer border-0"
                          >
                            {copiedStudentId === student.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                                <span className="text-emerald-600 dark:text-emerald-500 font-bold">Number Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                <span>Copy Number</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inactive Students Card */}
      <div className="rounded-3xl border border-zinc-100/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 pt-5 px-3 sm:px-5 pb-0 shadow-xs flex flex-col h-[380px] transition-all duration-300">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider">
              Inactive Students
            </h3>
            <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {sortedInactiveStudents.length}
            </span>
          </div>
          
          <button
            onClick={() => setInactiveSortOrder(prev => prev === "latest" ? "oldest" : "latest")}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
          >
            {inactiveSortOrder === "latest" ? (
              <>
                <span>Latest</span>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            ) : (
              <>
                <span>Oldest</span>
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-0 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {sortedInactiveStudents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
              No inactive students
            </div>
          ) : (
            sortedInactiveStudents.map((student) => {
              return (
                <div
                  key={student.id}
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                  className="flex items-center justify-between py-3 px-0 sm:px-3 rounded-2xl bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200 cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar student={student} size={40} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-brand-orange-500 dark:group-hover:text-brand-orange-500 transition-colors">
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                        <span>TAG{String(student.studentNumber).padStart(3, "0")}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>{student.sessionsCompleted}/{student.totalSessions}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 relative">
                    {/* Clickable Phone Number + Copy Container (only on screens >= 1440px) */}
                    <div
                      onClick={(e) => handleCopy(student.id, student.contactNumber, e)}
                      className="hidden min-[1440px]:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-555 hover:text-zinc-855 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Click to copy phone number"
                    >
                      <span className="text-xs font-semibold">
                        {student.contactNumber}
                      </span>
                      {copiedStudentId === student.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsappModal(student, e, false);
                      }}
                      className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 transition-colors cursor-pointer border-0 shrink-0 active:scale-95"
                      title="Send WhatsApp message"
                    >
                      <svg
                        className="w-4.5 h-4.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                      </svg>
                    </button>

                    {/* Actions Dropdown (hidden on screens >= 1440px) */}
                    <div className="relative min-[1440px]:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuStudentId(activeMenuStudentId === student.id ? null : student.id);
                        }}
                        className="h-8 w-8 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors border-0 cursor-pointer active:scale-95"
                        title="More actions"
                      >
                        <MoreVertical className="h-4.5 w-4.5 shrink-0" />
                      </button>

                      {activeMenuStudentId === student.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 z-50 animate-menu-show"
                        >
                          {/* Phone Number Header */}
                          <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/60 mb-1 select-text tracking-wider font-mono">
                            {student.contactNumber}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              handleCopy(student.id, student.contactNumber, e);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-2 cursor-pointer border-0"
                          >
                            {copiedStudentId === student.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                                <span className="text-emerald-600 dark:text-emerald-500 font-bold">Number Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                <span>Copy Number</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
