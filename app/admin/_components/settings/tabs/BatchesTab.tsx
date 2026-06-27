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
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";

interface BatchesTabProps {
  initialBatches: BatchWithCount[];
  students: any[];
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors";

const TIME_VALUES = (() => {
  const options = [];
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (let h of hours) {
    for (let min of ["00", "30"]) {
      options.push(`${h}:${min}`);
    }
  }
  return options;
})();

const roundToHalfHour = (timeVal: string) => {
  const [h, m] = timeVal.split(":");
  const min = parseInt(m) || 0;
  if (min < 15) return `${h}:00`;
  if (min < 45) return `${h}:30`;
  const hr = parseInt(h) || 12;
  const nextHr = hr === 12 ? 1 : hr + 1;
  return `${nextHr}:00`;
};

const parseTiming = (timingStr?: string | null) => {
  if (!timingStr) return { startVal: "7:00", startPeriod: "AM", endVal: "8:00", endPeriod: "AM" };
  const parts = timingStr.split(/(?:–|-|to)/).map(p => p.trim());
  const startPart = parts[0] || "7:00 AM";
  const endPart = parts[1] || "8:00 AM";

  const startMatch = startPart.match(/^(\d+:\d+)\s*(AM|PM)$/i);
  const endMatch = endPart.match(/^(\d+:\d+)\s*(AM|PM)$/i);

  const rawStartVal = startMatch ? startMatch[1] : "7:00";
  const rawEndVal = endMatch ? endMatch[1] : "8:00";

  return {
    startVal: roundToHalfHour(rawStartVal),
    startPeriod: startMatch ? startMatch[2].toUpperCase() : "AM",
    endVal: roundToHalfHour(rawEndVal),
    endPeriod: endMatch ? endMatch[2].toUpperCase() : "AM",
  };
};

export default function BatchesTab({ initialBatches, students }: BatchesTabProps) {
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchWithCount | null>(null);
  const [selectedBatchIdForStudents, setSelectedBatchIdForStudents] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBatchForEdit, setSelectedBatchForEdit] = useState<BatchWithCount | null>(null);
  const [useDefaultPricing, setUseDefaultPricing] = useState(true);
  const [startTimePeriod, setStartTimePeriod] = useState("AM");
  const [endTimePeriod, setEndTimePeriod] = useState("AM");

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
          dayCounts: {
            Sunday: 0,
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0,
          },
          startAge: parseInt(formData.get("startAge") as string) || 0,
          endAge: parseInt(formData.get("endAge") as string) || 99,
          useDefaultPricing: formData.get("useDefaultPricing") === "true",
          price1d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price1d") as string) || 0),
          price2d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price2d") as string) || 0),
          price3d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price3d") as string) || 0),
          price4d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price4d") as string) || 0),
          price5d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price5d") as string) || 0),
          price6d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price6d") as string) || 0),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setBatches((prev) => [...prev, newBatch]);
        setModalOpen(false);
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
                  startAge: parseInt(formData.get("startAge") as string) || 0,
                  endAge: parseInt(formData.get("endAge") as string) || 99,
                  useDefaultPricing: formData.get("useDefaultPricing") === "true",
                  price1d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price1d") as string) || 0),
                  price2d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price2d") as string) || 0),
                  price3d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price3d") as string) || 0),
                  price4d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price4d") as string) || 0),
                  price5d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price5d") as string) || 0),
                  price6d: formData.get("useDefaultPricing") === "true" ? null : (parseInt(formData.get("price6d") as string) || 0),
                }
              : b
          )
        );
        setModalOpen(false);
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
        setDeleteModalOpen(false);
        setBatchToDelete(null);
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

      <div className="w-full">
        {/* Header inside card */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Batches
          </h2>
          <button
            type="button"
            onClick={() => {
              setModalMode("add");
              setSelectedBatchForEdit(null);
              setUseDefaultPricing(true);
              setStartTimePeriod("AM");
              setEndTimePeriod("AM");
              setModalOpen(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-orange-600 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add batch
          </button>
        </div>

        <div className="space-y-3">
          {/* Batch list */}
          {batches.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-zinc-950 shadow-xs border border-zinc-100 dark:border-zinc-800/60 py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-zinc-400" strokeWidth={2} />
              </div>
              <p className="text-sm font-medium text-zinc-650 dark:text-zinc-400">
                No batches yet
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Add a batch to start grouping students by time slot.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => {
                const batchStudents = students.filter(s => s.activePlan?.batchId === batch.id);
                const count = batchStudents.length;

                return (
                  <div key={batch.id} 
                    onClick={() => {
                      setSelectedBatchForEdit(batch);
                      setModalMode("edit");
                      setUseDefaultPricing(batch.useDefaultPricing);
                      const parsed = parseTiming(batch.timing);
                      setStartTimePeriod(parsed.startPeriod);
                      setEndTimePeriod(parsed.endPeriod);
                      setModalOpen(true);
                    }}
                    className="relative rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 p-5 hover:border-brand-orange-500/50 hover:shadow-md hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 flex flex-col justify-between min-h-[140px] cursor-pointer group"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base group-hover:text-brand-orange-550 transition-colors">
                          {batch.name}
                        </h3>
                        {batch.useDefaultPricing ? (
                          <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            Default Pricing
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-brand-orange-655 bg-brand-orange-50 dark:text-brand-orange-400 dark:bg-brand-orange-950/20 px-2 py-0.5 rounded-full">
                            Custom Pricing
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-400">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-medium">{batch.timing}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-400">
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          <span>
                            Age limit: <strong className="text-zinc-700 dark:text-zinc-300">{batch.startAge}–{batch.endAge} years</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-405 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatchIdForStudents(batch.id);
                            }}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                          >
                            {count} Student{count !== 1 ? "s" : ""} Enrolled
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hover edit icon in the bottom-right */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 text-zinc-400 group-hover:text-brand-orange-500">
                      <Pencil className="h-4 w-4" />
                    </div>
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

        {/* Modal Popup form for Add / Edit */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
          >
            <form
              action={modalMode === "add" ? createAction : editAction}
              className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-8 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in"
            >
              {modalMode === "edit" && selectedBatchForEdit && (
                <input type="hidden" name="id" value={selectedBatchForEdit.id} />
              )}
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {modalMode === "add" ? "Add New Batch" : "Edit Batch"}
                </h3>

                <div className="flex items-center gap-2">
                  {modalMode === "edit" && selectedBatchForEdit && (() => {
                    const batchStudents = students.filter(s => s.activePlan?.batchId === selectedBatchForEdit.id);
                    const count = batchStudents.length;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setModalOpen(false);
                            setSelectedBatchIdForStudents(selectedBatchForEdit.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                          title="View Enrolled Students"
                        >
                          <Users className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Students ({count})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setModalOpen(false);
                            setBatchToDelete(selectedBatchForEdit);
                            setDeleteModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5 pb-2">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-405 mb-1.5 uppercase tracking-wider">
                      Batch name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Morning Batch"
                      defaultValue={modalMode === "edit" && selectedBatchForEdit ? selectedBatchForEdit.name : ""}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-405 mb-1.5 uppercase tracking-wider">
                      Start Time *
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        name="startTimeVal"
                        required
                        defaultValue={
                          modalMode === "edit" && selectedBatchForEdit
                            ? parseTiming(selectedBatchForEdit.timing).startVal
                            : "7:00"
                        }
                        className={inputClass}
                      >
                        {TIME_VALUES.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 shrink-0 h-[42px] items-center">
                        <button
                          type="button"
                          onClick={() => setStartTimePeriod("AM")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            startTimePeriod === "AM"
                              ? "bg-white dark:bg-zinc-900 shadow-xs text-brand-orange-600 dark:text-brand-orange-400"
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartTimePeriod("PM")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            startTimePeriod === "PM"
                              ? "bg-white dark:bg-zinc-900 shadow-xs text-brand-orange-600 dark:text-brand-orange-400"
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                      <input type="hidden" name="startTimePeriod" value={startTimePeriod} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-405 mb-1.5 uppercase tracking-wider">
                      End Time *
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        name="endTimeVal"
                        required
                        defaultValue={
                          modalMode === "edit" && selectedBatchForEdit
                            ? parseTiming(selectedBatchForEdit.timing).endVal
                            : "8:00"
                        }
                        className={inputClass}
                      >
                        {TIME_VALUES.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 shrink-0 h-[42px] items-center">
                        <button
                          type="button"
                          onClick={() => setEndTimePeriod("AM")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            endTimePeriod === "AM"
                              ? "bg-white dark:bg-zinc-900 shadow-xs text-brand-orange-600 dark:text-brand-orange-400"
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndTimePeriod("PM")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            endTimePeriod === "PM"
                              ? "bg-white dark:bg-zinc-900 shadow-xs text-brand-orange-600 dark:text-brand-orange-400"
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                      <input type="hidden" name="endTimePeriod" value={endTimePeriod} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-405 mb-1.5 uppercase tracking-wider">
                      Start age (years) *
                    </label>
                    <input
                      type="number"
                      name="startAge"
                      required
                      min="0"
                      placeholder="e.g. 5"
                      defaultValue={modalMode === "edit" && selectedBatchForEdit ? selectedBatchForEdit.startAge : 0}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-405 mb-1.5 uppercase tracking-wider">
                      End age (years) *
                    </label>
                    <input
                      type="number"
                      name="endAge"
                      required
                      min="0"
                      placeholder="e.g. 15"
                      defaultValue={modalMode === "edit" && selectedBatchForEdit ? selectedBatchForEdit.endAge : 99}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Default Pricing Toggle */}
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                        Use default class rates
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                        Toggle off to set custom pricing overrides.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseDefaultPricing(!useDefaultPricing)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        useDefaultPricing ? "bg-brand-orange-500" : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          useDefaultPricing ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <input type="hidden" name="useDefaultPricing" value={useDefaultPricing ? "true" : "false"} />
                  </div>

                  {!useDefaultPricing && (
                    <div className="mt-4 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-950/20 space-y-4 animate-fade-in">
                      <p className="text-xs font-bold text-zinc-650 dark:text-zinc-450 uppercase tracking-wider">
                        Override Pricing per session (in INR)
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <div key={num}>
                            <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-455 uppercase mb-1">
                              {num} day/wk
                            </label>
                            <input
                              type="number"
                              name={`price${num}d`}
                              required={!useDefaultPricing}
                              min="0"
                              placeholder="e.g. 500"
                              defaultValue={modalMode === "edit" && selectedBatchForEdit ? ((selectedBatchForEdit as any)[`price${num}d`] ?? "") : ""}
                              className={inputClass}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2.5 pt-5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalMode === "add" ? isCreatePending : isEditPending}
                  className="rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {modalMode === "add"
                    ? isCreatePending ? "Creating…" : "Create batch"
                    : isEditPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && batchToDelete && (() => {
          const batchStudents = students.filter(s => s.activePlan?.batchId === batchToDelete.id);
          const count = batchStudents.length;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => {
                setDeleteModalOpen(false);
                setBatchToDelete(null);
              }}
            >
              <div
                className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-455 mb-4">
                  <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Delete Batch?
                  </h3>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-zinc-650 dark:text-zinc-400">
                    Are you sure you want to delete the batch <strong className="text-zinc-900 dark:text-zinc-100">"{batchToDelete.name}"</strong>?
                  </p>
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">⚠️ Warning:</p>
                    <p>
                      This batch currently has <strong className="font-semibold">{count}</strong> active student{count !== 1 ? "s" : ""} enrolled. Deleting it will unassign all of them from this batch.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setBatchToDelete(null);
                    }}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(batchToDelete.id)}
                    disabled={isPending}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {isPending ? "Deleting…" : "Delete Batch"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Student List Modal Overlay */}
      {selectedBatchIdForStudents && (() => {
        const selectedBatch = batches.find(b => b.id === selectedBatchIdForStudents);
        const batchStudents = students.filter(s => s.activePlan?.batchId === selectedBatchIdForStudents);

        const WEEKDAYS: { key: string; short: string }[] = [
          { key: "Monday",    short: "Mon" },
          { key: "Tuesday",   short: "Tue" },
          { key: "Wednesday", short: "Wed" },
          { key: "Thursday",  short: "Thu" },
          { key: "Friday",    short: "Fri" },
          { key: "Saturday",  short: "Sat" },
          { key: "Sunday",    short: "Sun" },
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBatchIdForStudents(null)}>
            <div
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedBatch?.name}</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{selectedBatch?.timing}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBatchIdForStudents(null)}
                  className="mt-0.5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Day attendance strip */}
              <div className="flex items-center gap-0 px-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                {WEEKDAYS.map(({ key, short }) => {
                  const cnt = (selectedBatch?.dayCounts as any)?.[key] ?? 0;
                  const active = cnt > 0;
                  return (
                    <div key={key} className={`flex-1 flex flex-col items-center py-2 mx-0.5 rounded-lg ${active ? "bg-brand-orange-50 dark:bg-brand-orange-950/30" : "bg-zinc-100/60 dark:bg-zinc-800/40"}`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? "text-brand-orange-500 dark:text-brand-orange-400" : "text-zinc-400 dark:text-zinc-500"}`}>{short.slice(0,1)}</span>
                      <span className={`text-xs font-bold mt-0.5 ${active ? "text-brand-orange-600 dark:text-brand-orange-300" : "text-zinc-400 dark:text-zinc-600"}`}>
                        {cnt > 0 ? cnt : "–"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Student list */}
              <div className="flex-1 overflow-y-auto min-h-[280px]">
                {batchStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    <Users className="h-8 w-8 mb-2 stroke-1" />
                    <p className="text-sm">No students in this batch</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                    {batchStudents.map(student => {
                      const assignedDays: string[] = Array.isArray(student.activePlan?.selectedDays)
                        ? student.activePlan.selectedDays
                        : [];
                      const dayLabels = WEEKDAYS
                        .filter(({ key }) => assignedDays.includes(key))
                        .map(({ short }) => short)
                        .join(", ");
                      return (
                        <Link
                          key={student.id}
                          href={`/admin/students/${student.id}`}
                          className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                        >
                          <StudentAvatar
                            student={{
                              id: student.id,
                              name: student.name,
                              studentNumber: student.studentNumber,
                              gender: student.gender,
                              avatarUrl: student.avatarUrl,
                            }}
                            size={36}
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-orange-600 dark:group-hover:text-brand-orange-400 transition-colors truncate leading-tight">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                              #{student.studentNumber}{dayLabels ? ` · ${dayLabels}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <StudentStatusBadge status={student.status} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-zinc-400">{batchStudents.length} student{batchStudents.length !== 1 ? "s" : ""}</p>
                <button
                  type="button"
                  onClick={() => setSelectedBatchIdForStudents(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}
