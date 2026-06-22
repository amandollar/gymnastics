"use client";

import React, { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import {
  createBatchAction,
  renameBatchAction,
  deleteBatchAction,
} from "@/lib/actions/batches";
import type { BatchWithCount } from "@/lib/services/batches";
import { Clock, Pencil, Trash2, Plus, Users, X, Check } from "lucide-react";
import { getLevelConfig } from "@/lib/utils/level";
import StudentStatusBadge from "@/app/admin/_components/students/StudentStatusBadge";

interface BatchesTabProps {
  initialBatches: BatchWithCount[];
  students: any[];
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors";

export default function BatchesTab({ initialBatches, students }: BatchesTabProps) {
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedBatchIdForStudents, setSelectedBatchIdForStudents] = useState<string | null>(null);
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
    async (state: any, formData: FormData) => {
      const result = await createBatchAction(state, formData);
      if (result.success) {
        showToast("success", result.message || "Batch created.");
        const newBatch: BatchWithCount = {
          id: Math.random().toString(),
          name: formData.get("name") as string,
          timing: formData.get("timing") as string,
          studentCount: 0,
          activeCount: 0,
          graceCount: 0,
          inactiveCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setBatches((prev) => [...prev, newBatch]);
        setIsAddingNew(false);
      } else {
        showToast("error", result.message || "Failed to create batch.");
      }
      return result;
    },
    null
  );

  const [editState, editAction, isEditPending] = useActionState(
    async (state: any, formData: FormData) => {
      const result = await renameBatchAction(state, formData);
      if (result.success) {
        showToast("success", result.message || "Batch updated.");
        const id = formData.get("id") as string;
        setBatches((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  name: formData.get("name") as string,
                  timing: formData.get("timing") as string,
                }
              : b
          )
        );
        setEditingId(null);
      } else {
        showToast("error", result.message || "Failed to update batch.");
      }
      return result;
    },
    null
  );

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteBatchAction(null, fd);
      if (result.success) {
        showToast("success", result.message || "Batch deleted.");
        setBatches((prev) => prev.filter((b) => b.id !== id));
        setDeleteConfirmId(null);
      } else {
        showToast("error", result.message || "Failed to delete batch.");
      }
    });
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-4 lg:p-6 shadow-xs">
        {/* Header inside card */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Batches
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsAddingNew(!isAddingNew);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-orange-600 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add batch
          </button>
        </div>

        <div className="space-y-3">
        {/* Add form */}
        {isAddingNew && (
          <div className="rounded-2xl bg-white dark:bg-zinc-950 p-5 shadow-xs border border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                New batch
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <form action={createAction} className="space-y-3">
              <div className="grid lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Batch name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Morning Batch"
                    className={inputClass}
                  />
                  {createState?.message && !createState.success && (
                    <p className="mt-1 text-xs text-rose-500">{createState.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Timing
                  </label>
                  <input
                    type="text"
                    name="timing"
                    required
                    placeholder="e.g. 7:00 AM – 8:00 AM"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatePending}
                  className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isCreatePending ? "Creating…" : "Create batch"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Batch list */}
        {batches.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-950 shadow-xs border border-zinc-100 dark:border-zinc-800/60 py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-5 w-5 text-zinc-400" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No batches yet
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Add a batch to start grouping students by time slot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
            {batches.map((batch) => {
              const batchStudents = students.filter(s => s.activePlan?.batchId === batch.id);
              const count = batchStudents.length;

              return (
                <div                   key={batch.id} 
                  className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-4 shadow-xs hover:border-zinc-350 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[140px] group relative"
                >
                  {editingId === batch.id ? (
                    /* Inline edit form inside card */
                    <form action={editAction} className="h-full flex flex-col justify-between gap-3">
                      <input type="hidden" name="id" value={batch.id} />
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Batch name
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            defaultValue={batch.name}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Timing
                          </label>
                          <input
                            type="text"
                            name="timing"
                            required
                            defaultValue={batch.timing}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-805">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-805 px-3 py-1.5 text-xs font-medium text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isEditPending}
                          className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {isEditPending ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Normal card content */
                    <>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-bold text-zinc-905 dark:text-zinc-100 text-sm">
                          {batch.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{batch.timing}</span>
                        </div>
                      </div>
                      {/* Row 1: Student Count Badge */}
                      <div className="mt-4 flex items-center">
                        <button
                          type="button"
                          onClick={() => setSelectedBatchIdForStudents(batch.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 dark:text-brand-orange-400 dark:hover:text-brand-orange-300 transition-colors bg-brand-orange-500/5 dark:bg-brand-orange-500/10 px-2.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>{count} student{count !== 1 ? "s" : ""}</span>
                        </button>
                      </div>

                      {/* Row 2: Actions Button Row */}
                      <div className="mt-4 flex items-center w-full">
                        <div className="flex items-center gap-2 w-full">
                          {deleteConfirmId === batch.id ? (
                            <div className="flex items-center gap-2 w-full bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs justify-between">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">Delete?</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(batch.id)}
                                  disabled={isPending}
                                  className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors disabled:opacity-50"
                                  title="Confirm delete"
                                >
                                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNew(false);
                                  setEditingId(batch.id);
                                }}
                                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Edit batch"
                              >
                                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(batch.id)}
                                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Delete batch"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info note */}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1 mt-4">
          Deleting a batch unassigns all students from it — their plans remain active.
        </p>
      </div>

      {/* Student List Modal Overlay */}
      {selectedBatchIdForStudents && (() => {
        const selectedBatch = batches.find(b => b.id === selectedBatchIdForStudents);
        const batchStudents = students.filter(s => s.activePlan?.batchId === selectedBatchIdForStudents);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 dark:bg-zinc-950/80 backdrop-blur-xs">
            <div 
              className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedBatch ? selectedBatch.name : "Batch Students"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {selectedBatch ? selectedBatch.timing : ""} • {batchStudents.length} student{batchStudents.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBatchIdForStudents(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[200px] max-h-[50vh]">
                {batchStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <Users className="h-8 w-8 mb-2 stroke-1" />
                    <p className="text-sm font-medium">No students assigned to this batch</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {batchStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0 pr-4">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors truncate block"
                          >
                            {student.name}
                          </Link>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {student.contactNumber || "No contact info"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${getLevelConfig(student.level).badgeBg} ${getLevelConfig(student.level).badgeText} ring-1 ring-zinc-200/40 dark:ring-zinc-800/40 whitespace-nowrap`}>
                            {getLevelConfig(student.level).shortLabel}
                          </span>
                          <StudentStatusBadge status={student.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBatchIdForStudents(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            {/* Backdrop overlay click behavior */}
            <div className="absolute inset-0 -z-10 cursor-default" onClick={() => setSelectedBatchIdForStudents(null)} />
          </div>
        );
      })()}
      </div>
    </div>
  );
}
