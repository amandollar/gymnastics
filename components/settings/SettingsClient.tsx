"use client";

import React, { useState, useTransition, useActionState } from "react";
import { createUser, updateUser, deleteUser } from "@/lib/actions/users";
import RoleBadge from "@/components/layout/RoleBadge";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TRAINER";
  createdAt: Date;
}

interface SettingsClientProps {
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

const roleDescriptions: Record<
  "ADMIN" | "MANAGER" | "TRAINER",
  { summary: string; permissions: { label: string; allowed: boolean }[] }
> = {
  ADMIN: {
    summary: "Full access to settings, users, finances, and all modules.",
    permissions: [
      { label: "Settings", allowed: true },
      { label: "Finances", allowed: true },
      { label: "Students", allowed: true },
      { label: "Plans", allowed: true },
      { label: "Attendance", allowed: true },
      { label: "Team", allowed: true },
    ],
  },
  MANAGER: {
    summary: "Can manage students, plans, attendance, and finances. No user settings.",
    permissions: [
      { label: "Settings", allowed: false },
      { label: "Finances", allowed: true },
      { label: "Students", allowed: true },
      { label: "Plans", allowed: true },
      { label: "Attendance", allowed: true },
      { label: "Team", allowed: false },
    ],
  },
  TRAINER: {
    summary: "Can view students and mark attendance only.",
    permissions: [
      { label: "Settings", allowed: false },
      { label: "Finances", allowed: false },
      { label: "Students", allowed: true },
      { label: "Plans", allowed: false },
      { label: "Attendance", allowed: true },
      { label: "Team", allowed: false },
    ],
  },
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500";

export default function SettingsClient({
  initialUsers,
  currentUserId,
}: SettingsClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User>(
    initialUsers.find((u) => u.id === currentUserId) || initialUsers[0]
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const [createState, createAction, isCreatePending] = useActionState(
    async (state: ActionResult | null, formData: FormData) => {
      const result = (await createUser(state, formData)) as ActionResult;
      if (result.success) {
        showToast("success", result.message || "User created.");
        setIsAddingNew(false);
        const newUser: User = {
          id: Math.random().toString(),
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "ADMIN" | "MANAGER" | "TRAINER",
          createdAt: new Date(),
        };
        setUsers((prev) => [newUser, ...prev]);
        setSelectedUser(newUser);
      } else {
        showToast("error", result.message || "Could not create user.");
      }
      return result;
    },
    null
  );

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
        setSelectedUser(updatedUser);
        setEditingUser(null);
      } else {
        showToast("error", result.message || "Could not update user.");
      }
      return result;
    },
    null
  );

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      showToast("error", "You cannot delete your own account.");
      return;
    }
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        showToast("success", result.message || "User deleted.");
        const nextUsers = users.filter((u) => u.id !== userId);
        setUsers(nextUsers);
        if (selectedUser.id === userId) {
          setSelectedUser(
            nextUsers.find((u) => u.id === currentUserId) || nextUsers[0]
          );
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

  const roleInfo = roleDescriptions[selectedUser.role];

  return (
    <div className="mx-auto max-w-6xl space-y-6 relative min-w-0 w-full">
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add and manage staff accounts and roles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setIsAddingNew(!isAddingNew);
          }}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          Add user
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start min-w-0">
        {/* Role preview — shown first on mobile for context */}
        <div className="lg:hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <RolePreviewCard selectedUser={selectedUser} roleInfo={roleInfo} compact />
        </div>

        <div className="lg:col-span-2 space-y-6 min-w-0 order-2 lg:order-none">
          {(isAddingNew || editingUser) && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-zinc-900">
                  {editingUser ? "Edit user" : "New user"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingUser(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                action={editingUser ? editAction : createAction}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingUser?.name || ""}
                      placeholder="Full name"
                      className={inputClass}
                    />
                    {(createState?.errors?.name || editState?.errors?.name) && (
                      <p className="mt-1 text-xs text-rose-600">
                        {(createState?.errors?.name || editState?.errors?.name)?.[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={editingUser?.email || ""}
                      placeholder="email@example.com"
                      className={inputClass}
                    />
                    {(createState?.errors?.email || editState?.errors?.email) && (
                      <p className="mt-1 text-xs text-rose-600">
                        {(createState?.errors?.email || editState?.errors?.email)?.[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      defaultValue={editingUser?.role || "TRAINER"}
                      className={inputClass}
                    >
                      <option value="TRAINER">Trainer</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Password
                      {editingUser && (
                        <span className="font-normal text-zinc-500">
                          {" "}
                          (leave blank to keep current)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={!editingUser}
                      placeholder={editingUser ? "Unchanged" : "Min. 6 characters"}
                      className={inputClass}
                    />
                    {(createState?.errors?.password || editState?.errors?.password) && (
                      <p className="mt-1 text-xs text-rose-600">
                        {(createState?.errors?.password || editState?.errors?.password)?.[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingUser(null);
                    }}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatePending || isEditPending}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatePending || isEditPending
                      ? "Saving…"
                      : editingUser
                        ? "Save changes"
                        : "Create user"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="search"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
                  />
                  <svg
                    className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full sm:w-auto rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="TRAINER">Trainer</option>
                </select>
              </div>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filteredUsers.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-zinc-500">
                  No users match your search.
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <UserListCard
                    key={u.id}
                    user={u}
                    isSelected={selectedUser.id === u.id}
                    isCurrentUser={u.id === currentUserId}
                    deleteConfirmId={deleteConfirmId}
                    isPending={isPending}
                    onSelect={() => setSelectedUser(u)}
                    onEdit={() => {
                      setIsAddingNew(false);
                      setEditingUser(u);
                    }}
                    onDeleteConfirm={() => setDeleteConfirmId(u.id)}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                    onDelete={() => handleDelete(u.id)}
                  />
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium text-zinc-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`cursor-pointer hover:bg-zinc-50/80 ${
                          selectedUser.id === u.id ? "bg-zinc-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 flex items-center gap-2">
                            {u.name}
                            {u.id === currentUserId && (
                              <span className="text-xs font-normal text-zinc-500">
                                (you)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-zinc-500">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteConfirmId === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-zinc-500">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(u.id)}
                                disabled={isPending}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNew(false);
                                  setEditingUser(u);
                                }}
                                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                              >
                                Edit
                              </button>
                              {u.id !== currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(u.id)}
                                  className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="hidden lg:block rounded-lg border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-20 order-3">
          <RolePreviewCard selectedUser={selectedUser} roleInfo={roleInfo} />
        </div>
      </div>
    </div>
  );
}

function RolePreviewCard({
  selectedUser,
  roleInfo,
  compact,
}: {
  selectedUser: User;
  roleInfo: (typeof roleDescriptions)["ADMIN"];
  compact?: boolean;
}) {
  const initials = selectedUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className={`flex ${compact ? "flex-row items-center gap-3 text-left" : "flex-col items-center text-center"}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600 ${
            compact ? "h-12 w-12 text-sm" : "h-16 w-16 text-lg"
          }`}
        >
          {initials}
        </div>
        <div className={compact ? "min-w-0 flex-1" : ""}>
          <h3 className={`font-medium text-zinc-900 ${compact ? "text-sm truncate" : "mt-3 text-base"}`}>
            {selectedUser.name}
          </h3>
          <p className={`text-zinc-500 ${compact ? "text-xs truncate" : "text-sm"}`}>
            {selectedUser.email}
          </p>
          <div className={compact ? "mt-1" : "mt-2"}>
            <RoleBadge role={selectedUser.role} />
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
            {roleInfo.summary}
          </p>
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-500 mb-3">Access</p>
            <ul className="space-y-2">
              {roleInfo.permissions.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-700">{p.label}</span>
                  <span
                    className={
                      p.allowed
                        ? "text-emerald-600 text-xs font-medium"
                        : "text-zinc-400 text-xs"
                    }
                  >
                    {p.allowed ? "Yes" : "No"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

function UserListCard({
  user,
  isSelected,
  isCurrentUser,
  deleteConfirmId,
  isPending,
  onSelect,
  onEdit,
  onDeleteConfirm,
  onDeleteCancel,
  onDelete,
}: {
  user: User;
  isSelected: boolean;
  isCurrentUser: boolean;
  deleteConfirmId: string | null;
  isPending: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`p-4 cursor-pointer ${isSelected ? "bg-zinc-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 truncate">
            {user.name}
            {isCurrentUser && (
              <span className="font-normal text-zinc-500"> (you)</span>
            )}
          </p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <span className="text-xs text-zinc-400">
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div
          className="flex shrink-0 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {deleteConfirmId === user.id ? (
            <>
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="text-xs font-medium text-rose-600 cursor-pointer disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="text-xs font-medium text-zinc-600 cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="text-xs font-medium text-zinc-600 cursor-pointer py-1 px-2"
              >
                Edit
              </button>
              {!isCurrentUser && (
                <button
                  type="button"
                  onClick={onDeleteConfirm}
                  className="text-xs font-medium text-rose-600 cursor-pointer py-1 px-2"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
