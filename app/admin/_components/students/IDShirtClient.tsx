"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Check,
  IdCard,
  Shirt,
  AlertCircle,
  Users,
} from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import StudentStatusBadge from "@/app/admin/_components/students/StudentStatusBadge";
import { updateStudentIdCardAction, updateStudentShirtAction } from "@/lib/actions/students";
import type { StudentStatus } from "@/lib/utils/student";

// Helper function to format ID as TAG001, TAG012, etc.
function formatStudentId(num: number): string {
  const padded = String(num).padStart(3, "0");
  return `TAG${padded}`;
}

type IDShirtStudent = {
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
  shirtProvided: boolean;
  idCardProvided: boolean;
  activePlan?: {
    batchId?: string | null;
    batch?: {
      id: string;
      name: string;
      timing: string;
    } | null;
  } | null;
};

type IDShirtClientProps = {
  students: IDShirtStudent[];
  batches: any[];
};

export default function IDShirtClient({ students, batches }: IDShirtClientProps) {
  const [studentList, setStudentList] = useState<IDShirtStudent[]>(students);
  const [search, setSearch] = useState("");
  const [shirtFilter, setShirtFilter] = useState<"all" | "provided" | "not_provided">("all");
  const [idCardFilter, setIdCardFilter] = useState<"all" | "provided" | "not_provided">("all");
  
  // Status checklist state: ACTIVE, GRACE, FREEZE are checked by default
  const [selectedStatuses, setSelectedStatuses] = useState<Set<StudentStatus>>(
    new Set(["ACTIVE", "GRACE", "FREEZE"])
  );

  // Sync props to state if they change
  useEffect(() => {
    setStudentList(students);
  }, [students]);

  // Track confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    studentId: string;
    studentName: string;
    type: "idCard" | "shirt";
  } | null>(null);

  // Status counts (total count of students in each status, before filters)
  const statusCounts = useMemo(() => {
    const counts: Record<StudentStatus, number> = {
      ACTIVE: 0,
      GRACE: 0,
      FREEZE: 0,
      INACTIVE: 0,
      EXPIRED: 0,
      NO_PLAN: 0,
    };
    studentList.forEach((s) => {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });
    return counts;
  }, [studentList]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return studentList.filter((student) => {
      // 1. Status Filter
      if (!selectedStatuses.has(student.status)) {
        return false;
      }

      // 2. Search Filter
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const studentIdStr = `tag${String(student.studentNumber).padStart(3, "0")}`;
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesId = studentIdStr.includes(q) || String(student.studentNumber).includes(q);
        if (!matchesName && !matchesId) {
          return false;
        }
      }

      // 3. Shirt Filter
      if (shirtFilter === "provided" && !student.shirtProvided) return false;
      if (shirtFilter === "not_provided" && student.shirtProvided) return false;

      // 4. ID Card Filter
      if (idCardFilter === "provided" && !student.idCardProvided) return false;
      if (idCardFilter === "not_provided" && student.idCardProvided) return false;

      return true;
    });
  }, [studentList, selectedStatuses, search, shirtFilter, idCardFilter]);

  const handleStatusToggle = (status: StudentStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(new Set(["ACTIVE", "GRACE", "FREEZE", "INACTIVE", "EXPIRED", "NO_PLAN"]));
  };

  const handleResetStatusesToDefault = () => {
    setSelectedStatuses(new Set(["ACTIVE", "GRACE", "FREEZE"]));
  };

  const handleClearAllStatuses = () => {
    setSelectedStatuses(new Set());
  };

  // Perform optimistic update and trigger server action
  const toggleStatusValue = async (studentId: string, type: "idCard" | "shirt", newValue: boolean) => {
    const field = type === "idCard" ? "idCardProvided" : "shirtProvided";
    const previousList = [...studentList];

    // Optimistically update local state
    setStudentList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, [field]: newValue } : s))
    );

    // Call server action in background
    const action = type === "idCard"
      ? updateStudentIdCardAction(studentId, newValue)
      : updateStudentShirtAction(studentId, newValue);

    const res = await action;
    if (!res.success) {
      // Revert state if backend fails
      setStudentList(previousList);
      alert(res.message || `Failed to update ${type === "idCard" ? "ID Card" : "Shirt"} status.`);
    }
  };

  // Click handler for ID/Shirt buttons
  const handleButtonClick = (student: IDShirtStudent, type: "idCard" | "shirt") => {
    const currentValue = type === "idCard" ? student.idCardProvided : student.shirtProvided;

    if (!currentValue) {
      // Mark as provided immediately
      toggleStatusValue(student.id, type, true);
    } else {
      // Already provided, show confirmation popup before marking as not provided
      setConfirmModal({
        studentId: student.id,
        studentName: student.name,
        type,
      });
    }
  };

  const handleConfirmNotProvided = () => {
    if (confirmModal) {
      toggleStatusValue(confirmModal.studentId, confirmModal.type, false);
      setConfirmModal(null);
    }
  };

  const statusOptions: { value: StudentStatus; label: string }[] = [
    { value: "ACTIVE", label: "Active" },
    { value: "GRACE", label: "Grace" },
    { value: "FREEZE", label: "Freeze" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "EXPIRED", label: "Expired" },
    { value: "NO_PLAN", label: "No Plan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-zinc-950 dark:text-zinc-50">
              ID & Shirt Tracking
            </h1>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Section - Status Checkmarks Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-250 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Student Status
            </h2>

            {/* Checkbox List */}
            <div className="space-y-1">
              {statusOptions.map((st) => (
                <label
                  key={st.value}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(st.value)}
                    onChange={() => handleStatusToggle(st.value)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-orange-500 focus:ring-brand-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                    {st.label}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                    {statusCounts[st.value]}
                  </span>
                </label>
              ))}
            </div>

            {/* Action helpers */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleResetStatusesToDefault}
                className="text-xs font-medium text-brand-orange-500 hover:text-brand-orange-600 transition-colors"
              >
                Default
              </button>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs">|</span>
              <button
                type="button"
                onClick={handleSelectAllStatuses}
                className="text-xs font-medium text-zinc-550 hover:text-zinc-755 dark:text-zinc-400 dark:hover:text-zinc-250 transition-colors"
              >
                All
              </button>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs">|</span>
              <button
                type="button"
                onClick={handleClearAllStatuses}
                className="text-xs font-medium text-zinc-555 hover:text-zinc-755 dark:text-zinc-400 dark:hover:text-zinc-250 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Showing Count Summary */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Showing Students</span>
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-850 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 text-center w-full text-sm">
                {filteredStudents.length} of {studentList.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Search, Filters, and List */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
            {/* Search bar */}
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-orange-500/25 transition-shadow"
              />
            </div>

            {/* Shirt Filter */}
            <div className="sm:col-span-3">
              <select
                value={shirtFilter}
                onChange={(e) => setShirtFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange-500/25 transition-shadow cursor-pointer"
              >
                <option value="all">All Shirts</option>
                <option value="provided">Shirt: Provided</option>
                <option value="not_provided">Shirt: Not Provided</option>
              </select>
            </div>

            {/* ID Card Filter */}
            <div className="sm:col-span-3">
              <select
                value={idCardFilter}
                onChange={(e) => setIdCardFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange-500/25 transition-shadow cursor-pointer"
              >
                <option value="all">All ID Cards</option>
                <option value="provided">ID: Provided</option>
                <option value="not_provided">ID: Not Provided</option>
              </select>
            </div>
          </div>

          {/* Student Grid */}

          {/* Student Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-400 mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No students found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                No students match the current status, search, or distribution filters. Try updating your selections.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setShirtFilter("all");
                  setIdCardFilter("all");
                  handleResetStatusesToDefault();
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-orange-500 hover:bg-brand-orange-600 rounded-full transition-colors"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md"
                >
                  {/* Top: Student basic info */}
                  <div className="flex gap-3 items-start pb-4">
                    <StudentAvatar student={student} size={48} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                        {student.name}
                      </h3>
                      <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded">
                          {formatStudentId(student.studentNumber)}
                        </span>
                        <StudentStatusBadge status={student.status} />
                      </div>
                      {student.activePlan?.batch?.name && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 truncate">
                          Batch: {student.activePlan.batch.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* ID Provided Button */}
                    <button
                      type="button"
                      onClick={() => handleButtonClick(student, "idCard")}
                      className={`flex-1 min-w-[125px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        student.idCardProvided
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                          : "bg-white text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                      }`}
                    >
                      {student.idCardProvided ? (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>ID Provided</span>
                        </>
                      ) : (
                        <>
                          <IdCard className="w-3.5 h-3.5 shrink-0" />
                          <span>ID Provided</span>
                        </>
                      )}
                    </button>

                    {/* Shirt Provided Button */}
                    <button
                      type="button"
                      onClick={() => handleButtonClick(student, "shirt")}
                      className={`flex-1 min-w-[125px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        student.shirtProvided
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                          : "bg-white text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                      }`}
                    >
                      {student.shirtProvided ? (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Shirt Provided</span>
                        </>
                      ) : (
                        <>
                          <Shirt className="w-3.5 h-3.5 shrink-0" />
                          <span>Shirt Provided</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-xs transition-opacity duration-300">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 overflow-hidden border border-zinc-100 dark:border-zinc-850 transition-transform transform scale-100 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Mark as not provided?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Do you want to mark the <strong>{confirmModal.type === "idCard" ? "ID Card" : "Shirt"}</strong> as <strong>not provided</strong> for <strong>{confirmModal.studentName}</strong>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-350 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNotProvided}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                Yes, mark as not given
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
