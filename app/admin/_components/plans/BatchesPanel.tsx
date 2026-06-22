"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createBatchAction,
  renameBatchAction,
  deleteBatchAction,
} from "@/lib/actions/batches";
import type { BatchWithCount } from "@/lib/services/batches";
import { Plus, Pencil, Trash2, Check, X, Users, Clock, AlertTriangle } from "lucide-react";

const TIME_SLOTS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM"
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function DeleteConfirmDialog({
  batchName,
  onConfirm,
  onCancel,
  isPending,
}: {
  batchName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-4 animate-scale-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete batch?</h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Deleting <span className="font-semibold text-zinc-700 dark:text-zinc-200">&ldquo;{batchName}&rdquo;</span> will also{" "}
              <span className="font-semibold text-rose-600 dark:text-rose-400">unassign all students</span> from this batch.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────

export default function BatchesPanel({
  initialBatches,
  onClose,
  onSuccess,
}: {
  initialBatches: BatchWithCount[];
  onClose?: () => void;
  onSuccess?: (msg: string) => void;
}) {
  // Local optimistic state — synced from props after server revalidation
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches);

  // Keep in sync if prop changes (e.g. after revalidation)
  useEffect(() => {
    setBatches(initialBatches);
  }, [initialBatches]);

  // ── Add batch form ──
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStart, setNewStart] = useState("7:00 AM");
  const [newEnd, setNewEnd] = useState("8:00 AM");
  const [createState, createAction, createPending] = useActionState(createBatchAction, null);
  const lastSuccessRef = useRef<any>(null);

  useEffect(() => {
    if (createState?.success && lastSuccessRef.current !== createState) {
      lastSuccessRef.current = createState;
      setShowAddForm(false);
      setNewStart("7:00 AM");
      setNewEnd("8:00 AM");
      onSuccess?.(createState.message ?? "Batch created");
    }
  }, [createState, onSuccess]);

  // ── Rename state ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("7:00 AM");
  const [editEnd, setEditEnd] = useState("8:00 AM");
  const editNameRef = useRef<HTMLInputElement>(null);
  const [renameState, renameAction, renamePending] = useActionState(renameBatchAction, null);
  const lastRenameSuccessRef = useRef<any>(null);

  function startEdit(b: BatchWithCount) {
    setEditingId(b.id);
    setEditName(b.name);
    
    // Parse timing (e.g. "7:00 AM – 8:00 AM" or fallback to default)
    const parts = b.timing.split(/ – | - /);
    setEditStart(parts[0] || "7:00 AM");
    setEditEnd(parts[1] || "8:00 AM");
    
    setTimeout(() => editNameRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  useEffect(() => {
    if (renameState?.success && lastRenameSuccessRef.current !== renameState) {
      lastRenameSuccessRef.current = renameState;
      setEditingId(null);
      onSuccess?.(renameState.message ?? "Batch updated");
    }
  }, [renameState, onSuccess]);

  // ── Delete state ──
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<BatchWithCount | null>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteBatchAction, null);
  const [, startDeleteTransition] = useTransition();
  const lastDeleteSuccessRef = useRef<any>(null);

  useEffect(() => {
    if (deleteState?.success && lastDeleteSuccessRef.current !== deleteState) {
      lastDeleteSuccessRef.current = deleteState;
      setConfirmDeleteBatch(null);
      onSuccess?.(deleteState.message ?? "Batch deleted");
    }
  }, [deleteState, onSuccess]);

  function handleDeleteConfirm() {
    if (!confirmDeleteBatch) return;
    const fd = new FormData();
    fd.set("id", confirmDeleteBatch.id);
    startDeleteTransition(() => {
      deleteAction(fd);
    });
  }

  return (
    <>
      {confirmDeleteBatch && (
        <DeleteConfirmDialog
          batchName={confirmDeleteBatch.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDeleteBatch(null)}
          isPending={deletePending}
        />
      )}

      <div className="space-y-4">
        {/* Batch list */}
        {batches.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Users className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No batches yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {batches.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/60 dark:bg-zinc-800/30 overflow-hidden"
              >
                {editingId === b.id ? (
                  /* ── Inline edit form ── */
                  <form action={renameAction} className="p-3.5">
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="timing" value={`${editStart} – ${editEnd}`} />
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-brand-orange-600 dark:text-brand-orange-400">Edit Batch</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          ref={editNameRef}
                          name="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Batch name"
                          required
                          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            required
                            className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 cursor-pointer text-center font-medium"
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium shrink-0">to</span>
                          <select
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            required
                            className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 cursor-pointer text-center font-medium"
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={renamePending}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Save Changes
                        </button>
                      </div>
                    </div>
                    {renameState?.message && !renameState.success && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{renameState.message}</p>
                    )}
                  </form>
                ) : (
                  /* ── Display row ── */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {b.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{b.timing}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                      <Users className="h-3 w-3" />
                      {b.studentCount}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(b)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        aria-label={`Rename ${b.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBatch(b)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        aria-label={`Delete ${b.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}

            {showAddForm && (
              <li className="rounded-xl border border-brand-orange-200 dark:border-brand-orange-900/40 bg-brand-orange-50/10 dark:bg-brand-orange-950/5 p-3.5 shadow-sm">
                <form action={createAction}>
                  <input type="hidden" name="timing" value={`${newStart} – ${newEnd}`} />
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-brand-orange-600 dark:text-brand-orange-400">Add New Batch</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        name="name"
                        type="text"
                        placeholder="Batch name"
                        required
                        autoFocus
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          required
                          className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 cursor-pointer text-center font-medium"
                        >
                          {TIME_SLOTS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium shrink-0">to</span>
                        <select
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          required
                          className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 cursor-pointer text-center font-medium"
                        >
                          {TIME_SLOTS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Add Batch
                      </button>
                    </div>
                  </div>
                  {createState?.message && !createState.success && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{createState.message}</p>
                  )}
                </form>
              </li>
            )}
          </ul>
        )}

        {/* Add batch button */}
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:border-brand-orange-400 dark:hover:border-brand-orange-600 hover:text-brand-orange-600 dark:hover:text-brand-orange-400 hover:bg-brand-orange-50/50 dark:hover:bg-brand-orange-950/10 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add batch
          </button>
        )}
      </div>
    </>
  );
}
