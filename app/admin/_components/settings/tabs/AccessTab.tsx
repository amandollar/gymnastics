"use client";

import React, {
  useState,
  useTransition,
  useActionState,
  useRef,
  useEffect,
} from "react";
import { createUser, updateUser, deleteUser } from "@/lib/actions/users";
import RoleBadge from "@/app/admin/_components/layout/RoleBadge";
import { X, Plus, Shield, Check, ChevronDown, User, Pencil, Trash2, Info } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: Date;
}

interface AccessTabProps {
  initialUsers: User[];
  currentUserId: string;
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

const getPermissionsList = (role: "ADMIN" | "STAFF") => {
  return [
    { label: "Can access", allowed: true },
    { label: "Academy", allowed: role === "ADMIN" },
    { label: "Users", allowed: role === "ADMIN" },
    { label: "Batches", allowed: true },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccessTab({
  initialUsers,
  currentUserId,
}: AccessTabProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // "Add new user" state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [formPassword, setFormPassword] = useState("");

  // "Edit user" state
  const [editFormName, setEditFormName] = useState("");
  const [editFormEmail, setEditFormEmail] = useState("");
  const [editFormRole, setEditFormRole] = useState<"ADMIN" | "STAFF">("STAFF");
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
    setFormName("");
    setFormEmail("");
    setFormRole("STAFF");
    setFormPassword("");
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("STAFF");
    setFormPassword("");
    setEditFormName("");
    setEditFormEmail("");
    setEditFormRole("STAFF");
    setEditFormPassword("");
  };

  // For "Add" form
  const addHasChanges =
    formName.trim() !== "" &&
    formEmail.trim() !== "" &&
    formPassword.trim() !== "";

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
      const result = (await createUser(state, formData)) as any;
      if (result.success) {
        showToast("success", result.message || "User created.");
        setIsAddingNew(false);
        setFormName("");
        setFormEmail("");
        setFormRole("STAFF");
        setFormPassword("");
        const newUser: User = {
          id: result.user?.id || Math.random().toString(),
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "ADMIN" | "STAFF",
          createdAt: result.user?.createdAt
            ? new Date(result.user.createdAt)
            : new Date(),
        };
        setUsers((prev) => [newUser, ...prev]);
      } else {
        showToast("error", result.message || "Could not create user.");
      }
      return result;
    },
    null,
  );

  // ─── Edit action ─────────────────────────────────────────────────────────────

  const [editState, editAction, isEditPending] = useActionState(
    async (state: ActionResult | null, formData: FormData) => {
      if (!editingUser) return state;
      const result = (await updateUser(
        editingUser.id,
        state,
        formData,
      )) as ActionResult;
      if (result.success) {
        showToast("success", result.message || "User updated.");
        const updatedUser: User = {
          ...editingUser,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "ADMIN" | "STAFF",
        };
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
        );
        setEditingUser(null);
        setEditFormName("");
        setEditFormEmail("");
        setEditFormRole("STAFF");
        setEditFormPassword("");
      } else {
        showToast("error", result.message || "Could not update user.");
      }
      return result;
    },
    null,
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
        setDeleteConfirmId(null);
      } else {
        showToast("error", result.message || "Could not delete user.");
      }
    });
  };

  // ─── No employee checking needed ──

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

      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Access Controls
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center p-2.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer border border-zinc-200 dark:border-zinc-800"
              title="View permissions summary"
            >
              <Info className="h-4.5 w-4.5" />
            </button>
             <button
              type="button"
              onClick={handleAddNewClick}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-brand-orange-600 transition-all cursor-pointer shadow-xs"
            >
              Add User
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* ─── User list table ─────────────────────────────────────────── */}
          <div className="overflow-hidden bg-transparent">
            {/* Table */}
            <div className="overflow-visible mt-2">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-xs font-semibold text-zinc-555 dark:text-zinc-450 uppercase tracking-wider">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Access role</th>
                    <th className="px-4 py-3">Created at</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900/40">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-zinc-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-[#f3f2ee]/50 dark:hover:bg-zinc-900/40 transition-all duration-150"
                        >
                          <td className="px-4 py-2 first:rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  u.role === "ADMIN"
                                    ? "/icons/admin-profile-placeholder.webp"
                                    : "/icons/staff-profile-placeholder.webp"
                                }
                                alt={u.name}
                                className="h-14 w-14 shrink-0 rounded-full object-cover bg-zinc-100 dark:bg-zinc-900"
                              />
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
                          <td className="px-4 py-2">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400 text-xs">
                            {new Date(u.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-4 py-2 text-right last:rounded-r-2xl">
                            {deleteConfirmId === u.id ? (
                              <div className="flex items-center justify-end gap-3 text-xs">
                                <span className="text-zinc-400">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(u.id)}
                                  disabled={isPending}
                                  className="font-bold text-rose-600 dark:text-rose-455 hover:underline cursor-pointer"
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
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(u)}
                                  className="text-zinc-500 hover:text-brand-orange-500 dark:text-zinc-400 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" strokeWidth={2} />
                                </button>
                                {u.id !== currentUserId ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                                  </button>
                                ) : (
                                  <span className="text-zinc-200 dark:text-zinc-800 cursor-not-allowed select-none" title="Cannot delete current user">
                                    <Trash2 className="w-4 h-4 opacity-30" strokeWidth={2} />
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddingNew || editingUser) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && handleCancel()}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-8 overflow-hidden flex flex-col border border-zinc-150 dark:border-zinc-850/80 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingUser ? "Edit Access" : "Grant Access"}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            {isAddingNew && (
              <form action={createAction} className="space-y-4">
                <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Saif Tamboli"
                      className={inputClass}
                    />
                    {createState?.errors?.name && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        {createState.errors.name[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Access role <span className="text-zinc-400 font-normal">(permissions)</span>
                    </label>
                    <select
                      name="role"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className={inputClass}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
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

                <div className="flex justify-end gap-2 pt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-850 px-4 py-2 text-sm font-medium text-zinc-750 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
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

            {editingUser && (
              <form action={editAction} className="space-y-4">
                <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={editFormName}
                      onChange={(e) => setEditFormName(e.target.value)}
                      placeholder="e.g. Saif Tamboli"
                      className={inputClass}
                    />
                    {editState?.errors?.name && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        {editState.errors.name[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
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
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Access role <span className="text-zinc-400 font-normal">(permissions)</span>
                    </label>
                    <select
                      name="role"
                      value={editFormRole}
                      onChange={(e) => setEditFormRole(e.target.value as any)}
                      className={inputClass}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                      Password <span className="font-normal text-zinc-400">(leave blank to keep)</span>
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

                <div className="flex justify-end gap-2 pt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-850 px-4 py-2 text-sm font-medium text-zinc-750 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirmId(null)}
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-150 dark:border-zinc-850/80 p-8 flex flex-col items-center text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-600 dark:text-rose-455 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete user account?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              This action cannot be undone. This user will immediately lose access to the panel.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-750 text-white transition-all cursor-pointer text-center disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Permissions Summary Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowInfoModal(false)}
        >
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-8 overflow-hidden flex flex-col border border-zinc-150 dark:border-zinc-850/80 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-orange-500" />
                Role Permissions Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Staff Column */}
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 p-5 bg-zinc-50/50 dark:bg-zinc-950/20">
                <h4 className="text-sm font-bold text-zinc-905 dark:text-zinc-100 mb-4 flex items-center justify-between">
                  <span>Staff Permissions</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    Staff
                  </span>
                </h4>
                <div className="space-y-3">
                  {getPermissionsList("STAFF").map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Check className={`h-3.5 w-3.5 ${p.allowed ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"}`} />
                        {p.label}
                      </span>
                      <span className={p.allowed ? "text-emerald-600 dark:text-emerald-450 font-bold" : "text-zinc-300 dark:text-zinc-700"}>
                        {p.allowed ? "Yes" : "No"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Column */}
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 p-5 bg-zinc-50/50 dark:bg-zinc-950/20">
                <h4 className="text-sm font-bold text-zinc-905 dark:text-zinc-100 mb-4 flex items-center justify-between">
                  <span>Admin Permissions</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-brand-orange-50 dark:bg-brand-orange-950/30 text-brand-orange-600 dark:text-brand-orange-400">
                    Admin
                  </span>
                </h4>
                <div className="space-y-3">
                  {getPermissionsList("ADMIN").map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Check className={`h-3.5 w-3.5 ${p.allowed ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"}`} />
                        {p.label}
                      </span>
                      <span className={p.allowed ? "text-emerald-600 dark:text-emerald-455 font-bold" : "text-zinc-300 dark:text-zinc-700"}>
                        {p.allowed ? "Yes" : "No"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-8 mt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
