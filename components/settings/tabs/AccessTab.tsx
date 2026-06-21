"use client";

import React, { useState, useTransition, useActionState, useRef, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/lib/actions/users";
import RoleBadge from "@/components/layout/RoleBadge";
import { X, Search, Plus, Shield, Check, ChevronDown, User } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TRAINER";
  createdAt: Date;
}

interface Coach {
  id: string;
  name: string;
  email: string | null;
  role: "COACH" | "STAFF";
}

interface AccessTabProps {
  initialUsers: User[];
  currentUserId: string;
  coaches: Coach[];
}

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
  };
};

const getPermissionsList = (role: "ADMIN" | "MANAGER" | "TRAINER") => {
  return [
    { label: "Can access", allowed: true },
    { label: "Academy", allowed: role === "ADMIN" },
    { label: "Users", allowed: role === "ADMIN" },
    { label: "Batches", allowed: role === "ADMIN" },
    { label: "Grace Periods", allowed: role === "ADMIN" },
    { label: "Fee Structure", allowed: role === "ADMIN" },
    { label: "Data Export", allowed: role === "ADMIN" },
    { label: "Appearance", allowed: true },
  ];
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors";

const readonlyClass =
  "w-full rounded-xl border border-zinc-150 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900/60 px-3 py-2 text-base md:text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed select-none";

// ─── Employee Picker ──────────────────────────────────────────────────────────

interface EmployeePickerProps {
  coaches: Coach[];
  selectedCoach: Coach | null;
  onSelect: (coach: Coach) => void;
  disabled?: boolean;
  disabledEmployeeIds?: Set<string>;
}

function EmployeePicker({
  coaches,
  selectedCoach,
  onSelect,
  disabled,
  disabledEmployeeIds,
}: EmployeePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = coaches.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (coach: Coach) => {
    onSelect(coach);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-base md:text-sm transition-colors text-left ${
          disabled
            ? "border-zinc-150 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-400 cursor-not-allowed"
            : selectedCoach
            ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedCoach ? (
            <>
              <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                {selectedCoach.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="truncate font-medium">{selectedCoach.name}</span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                selectedCoach.role === "COACH"
                  ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
              }`}>
                {selectedCoach.role === "COACH" ? "Coach" : "Staff"}
              </span>
            </>
          ) : (
            <span>Select an employee…</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-menu-show">
          {/* Search */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-8 pr-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-zinc-400">
                No employees found
              </div>
            ) : (
              filtered.map((coach) => {
                const initials = coach.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isDisabled = disabledEmployeeIds?.has(coach.id);
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => {
                      if (!isDisabled) {
                        handleSelect(coach);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isDisabled
                        ? "opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    } ${
                      selectedCoach?.id === coach.id ? "bg-brand-orange-50 dark:bg-brand-orange-900/10" : ""
                    }`}
                  >
                    <span className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      {initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {coach.name}
                        </span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          coach.role === "COACH"
                            ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                            : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                        }`}>
                          {coach.role === "COACH" ? "Coach" : "Staff"}
                        </span>
                        {isDisabled && (
                          <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            Granted
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {coach.email ?? <span className="italic text-zinc-400">No email on file</span>}
                      </span>
                    </span>
                    {selectedCoach?.id === coach.id && !isDisabled && (
                      <Check className="h-4 w-4 shrink-0 text-brand-orange-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccessTab({
  initialUsers,
  currentUserId,
  coaches,
}: AccessTabProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // "Add new user" state
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [formRole, setFormRole] = useState<"ADMIN" | "MANAGER" | "TRAINER">("TRAINER");
  const [formPassword, setFormPassword] = useState("");

  // "Edit user" state
  const [editFormName, setEditFormName] = useState("");
  const [editFormEmail, setEditFormEmail] = useState("");
  const [editFormRole, setEditFormRole] = useState<"ADMIN" | "MANAGER" | "TRAINER">("TRAINER");
  const [editFormPassword, setEditFormPassword] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEditClick = (u: User) => {
    setIsAddingNew(false);
    setEditingUser(u);
    setEditFormName(u.name);
    setEditFormEmail(u.email);
    setEditFormRole(u.role);
    setEditFormPassword("");
  };

  const handleAddNewClick = () => {
    setEditingUser(null);
    setIsAddingNew(true);
    setSelectedCoach(null);
    setFormRole("TRAINER");
    setFormPassword("");
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingUser(null);
    setSelectedCoach(null);
    setFormRole("TRAINER");
    setFormPassword("");
    setEditFormName("");
    setEditFormEmail("");
    setEditFormRole("TRAINER");
    setEditFormPassword("");
  };

  // For "Add" form — needs a coach selected + password
  const addHasChanges = selectedCoach !== null && formPassword.trim() !== "";

  // For "Edit" form
  const editHasChanges = editingUser
    ? editFormName !== editingUser.name ||
      editFormEmail !== editingUser.email ||
      editFormRole !== editingUser.role ||
      editFormPassword !== ""
    : false;

  // ─── Create action ───────────────────────────────────────────────────────────

  const [createState, createAction, isCreatePending] = useActionState(
    async (state: ActionResult | null, formData: FormData) => {
      const result = (await createUser(state, formData)) as ActionResult;
      if (result.success) {
        showToast("success", result.message || "User created.");
        setIsAddingNew(false);
        setSelectedCoach(null);
        setFormRole("TRAINER");
        setFormPassword("");
        const newUser: User = {
          id: Math.random().toString(),
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "ADMIN" | "MANAGER" | "TRAINER",
          createdAt: new Date(),
        };
        setUsers((prev) => [newUser, ...prev]);
      } else {
        showToast("error", result.message || "Could not create user.");
      }
      return result;
    },
    null
  );

  // ─── Edit action ─────────────────────────────────────────────────────────────

  const [editState, editAction, isEditPending] = useActionState(
    async (state: ActionResult | null, formData: FormData) => {
      if (!editingUser) return state;
      const result = (await updateUser(
        editingUser.id,
        state,
        formData
      )) as ActionResult;
      if (result.success) {
        showToast("success", result.message || "User updated.");
        const updatedUser: User = {
          ...editingUser,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "ADMIN" | "MANAGER" | "TRAINER",
        };
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updatedUser : u))
        );
        setEditingUser(null);
        setEditFormName("");
        setEditFormEmail("");
        setEditFormRole("TRAINER");
        setEditFormPassword("");
      } else {
        showToast("error", result.message || "Could not update user.");
      }
      return result;
    },
    null
  );

  // ─── Delete handler ──────────────────────────────────────────────────────────

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      showToast("error", "You cannot delete your own account.");
      return;
    }
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        showToast("success", result.message || "User deleted.");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (selectedUserId === userId) {
          setSelectedUserId(null);
        }
        setDeleteConfirmId(null);
      } else {
        showToast("error", result.message || "Could not delete user.");
      }
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // ─── Show all employees, but disable ones that cannot be granted access yet ──
  const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
  const employeeOptions = coaches;
  const disabledEmployeeIds = new Set(
    employeeOptions
      .filter(
        (c) =>
          !c.email?.trim() || existingEmails.has(c.email.trim().toLowerCase())
      )
      .map((c) => c.id)
  );
  const availableCoaches = employeeOptions.filter(
    (c) => c.email?.trim() && !existingEmails.has(c.email.trim().toLowerCase())
  );

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-4 lg:p-6 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Team Members
          </h2>
          <button
            type="button"
            onClick={handleAddNewClick}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-brand-orange-600 transition-all cursor-pointer shadow-xs"
          >
            Add User
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            <span className="mr-1.5 text-zinc-500 dark:text-zinc-400">Employee</span>
            = person
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            <span className="mr-1.5 text-zinc-500 dark:text-zinc-400">Access role</span>
            = permissions
          </span>
        </div>

        <div className="space-y-4">
          {/* ─── Add/Edit Form ──────────────────────────────────────────── */}
          {(isAddingNew || editingUser) && (
            <div className="rounded-2xl bg-white dark:bg-zinc-950 p-5 shadow-xs border border-zinc-150 dark:border-zinc-800/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {editingUser ? "Edit access" : "Grant access"}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {editingUser
                      ? "Update the user's access role."
                      : "Choose an employee, then assign their access role."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" strokeWidth={2} />
                </button>
              </div>

              {/* ── ADD NEW: pick from existing coaches ── */}
              {isAddingNew && (
                <form action={createAction} className="space-y-4">
                  {/* Hidden fields that get populated from the selected coach */}
                  <input type="hidden" name="name" value={selectedCoach?.name ?? ""} />
                  <input type="hidden" name="email" value={selectedCoach?.email ?? ""} />

                  {/* 1. Employee picker */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Employee <span className="text-zinc-400 font-normal">(person)</span>
                    </label>
                    {availableCoaches.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        All employees already have access, or no employees with an email address were found.
                      </p>
                    ) : (
                      <EmployeePicker
                        coaches={employeeOptions}
                        selectedCoach={selectedCoach}
                        onSelect={setSelectedCoach}
                        disabledEmployeeIds={disabledEmployeeIds}
                      />
                    )}
                  </div>

                  {/* 2. Pre-filled details (read-only) */}
                  {selectedCoach && (
                    <div className="grid gap-3 lg:grid-cols-2 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 p-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                          Full name
                        </label>
                        <p className={readonlyClass}>{selectedCoach.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                          Email address
                        </label>
                        <p className={readonlyClass}>{selectedCoach.email}</p>
                      </div>
                    </div>
                  )}

                  {/* 3. Access role + password */}
                  <div className="grid gap-3.5 lg:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Access role <span className="text-zinc-400 font-normal">(permissions)</span>
                      </label>
                      <select
                        name="role"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as any)}
                        className={inputClass}
                      >
                        <option value="TRAINER">Trainer</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Password <span className="text-zinc-400 font-normal">(required)</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className={inputClass}
                      />
                      {createState?.errors?.password && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {createState.errors.password[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {createState?.errors?.email && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      {createState.errors.email[0]}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-305 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatePending || !addHasChanges}
                      className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isCreatePending ? "Saving…" : "Grant access"}
                    </button>
                  </div>
                </form>
              )}

              {/* ── EDIT: regular form ── */}
              {editingUser && (
                <form action={editAction} className="space-y-3.5">
                  <div className="grid gap-3.5 lg:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={editFormName}
                        onChange={(e) => setEditFormName(e.target.value)}
                        placeholder="e.g. Jamy Smith"
                        className={inputClass}
                      />
                      {editState?.errors?.name && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {editState.errors.name[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={editFormEmail}
                        onChange={(e) => setEditFormEmail(e.target.value)}
                        placeholder="email@example.com"
                        className={inputClass}
                      />
                      {editState?.errors?.email && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {editState.errors.email[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Access role <span className="text-zinc-400 font-normal">(permissions)</span>
                      </label>
                      <select
                        name="role"
                        value={editFormRole}
                        onChange={(e) => setEditFormRole(e.target.value as any)}
                        className={inputClass}
                      >
                        <option value="TRAINER">Trainer</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                        Password{" "}
                        <span className="font-normal text-zinc-400">
                          (leave blank to keep)
                        </span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={editFormPassword}
                        onChange={(e) => setEditFormPassword(e.target.value)}
                        placeholder="Unchanged"
                        className={inputClass}
                      />
                      {editState?.errors?.password && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {editState.errors.password[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-305 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditPending || !editHasChanges}
                      className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isEditPending ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ─── User list table ─────────────────────────────────────────── */}
          <div className="overflow-hidden bg-transparent">
            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={2} />
                <input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-650 dark:text-zinc-350 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors"
              >
                <option value="ALL">Access role</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="TRAINER">Trainer</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-visible mt-2">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-xs font-semibold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Access role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900/40">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserId === u.id;
                      const initials = u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                            className={`cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-[#e8e6e2] dark:bg-zinc-800/90"
                                : "hover:bg-[#f3f2ee]/50 dark:hover:bg-zinc-900/40"
                            }`}
                          >
                            <td className="px-4 py-3.5 first:rounded-l-2xl">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 shrink-0 rounded-full bg-[#d8d6d2] dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <span className="truncate">{u.name}</span>
                                    {u.id === currentUserId && (
                                      <span className="text-[10px] font-normal text-zinc-450 dark:text-zinc-500 shrink-0">
                                        you
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-450 truncate mt-0.5">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <RoleBadge role={u.role} />
                            </td>
                            <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-xs">
                              {new Date(u.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td
                              className="px-4 py-3.5 text-right last:rounded-r-2xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deleteConfirmId === u.id ? (
                                <div className="flex items-center justify-end gap-2 text-xs">
                                  <span className="text-zinc-400">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(u.id)}
                                    disabled={isPending}
                                    className="font-bold text-rose-600 dark:text-rose-450 hover:underline cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="font-bold text-zinc-500 dark:text-zinc-400 hover:underline cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleEditClick(u)}
                                    className="text-zinc-900 dark:text-zinc-100 hover:text-brand-orange-500 underline decoration-1 underline-offset-4 cursor-pointer font-medium"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-zinc-400">/</span>
                                  {u.id !== currentUserId ? (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(u.id)}
                                      className="text-zinc-900 dark:text-zinc-100 hover:text-rose-600 underline decoration-1 underline-offset-4 cursor-pointer font-medium"
                                    >
                                      Delete
                                    </button>
                                  ) : (
                                    <span className="text-zinc-300 dark:text-zinc-700 cursor-not-allowed select-none">
                                      Delete
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Collapsible permissions panel */}
                          {isSelected && (
                            <tr>
                              <td colSpan={4} className="bg-transparent border-0 px-0 py-0 overflow-visible">
                                <div className="flex justify-end pr-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/10">
                                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 shadow-lg w-64 space-y-2 animate-menu-show">
                                    {getPermissionsList(u.role).map((p) => (
                                      <div
                                        key={p.label}
                                        className="flex items-center justify-between text-xs font-semibold"
                                      >
                                        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                          <Check className="h-3.5 w-3.5 text-zinc-400" />
                                          {p.label}
                                        </span>
                                        <span
                                          className={
                                            p.allowed
                                              ? "text-zinc-900 dark:text-zinc-105"
                                              : "text-zinc-400 dark:text-zinc-600"
                                          }
                                        >
                                          {p.allowed ? "✓" : "✕"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
