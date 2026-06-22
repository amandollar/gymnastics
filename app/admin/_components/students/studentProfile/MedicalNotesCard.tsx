"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { updateStudentNotesAndMedicalAction } from "@/lib/actions/students";

interface MedicalNotesCardProps {
  studentId: string;
  initialNotes: string | null;
  initialMedicalHistory: string | null;
  canManage: boolean;
}

export function MedicalNotesCard({
  studentId,
  initialNotes,
  initialMedicalHistory,
  canManage,
}: MedicalNotesCardProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [medical, setMedical] = useState(initialMedicalHistory ?? "");
  const [editingField, setEditingField] = useState<"medical" | "notes" | null>(
    null,
  );
  const [tempNotes, setTempNotes] = useState(initialNotes ?? "");
  const [tempMedical, setTempMedical] = useState(initialMedicalHistory ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveMedical = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await updateStudentNotesAndMedicalAction(studentId, {
        notes: notes || null,
        medicalHistory: tempMedical || null,
      });
      if (res.success) {
        setMedical(tempMedical);
        setEditingField(null);
      } else {
        setError(res.message || "Failed to update medical details");
      }
    } catch (e) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await updateStudentNotesAndMedicalAction(studentId, {
        notes: tempNotes || null,
        medicalHistory: medical || null,
      });
      if (res.success) {
        setNotes(tempNotes);
        setEditingField(null);
      } else {
        setError(res.message || "Failed to update notes");
      }
    } catch (e) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setNotes(initialNotes ?? "");
    setMedical(initialMedicalHistory ?? "");
  }, [initialNotes, initialMedicalHistory]);

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
      {error && (
        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 animate-fade-in">
          {error}
        </div>
      )}

      {/* Medical & Allergies Section */}
      <div className="space-y-1">
        {editingField === "medical" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Medical & Allergies
              </label>
            </div>
            <textarea
              value={tempMedical}
              onChange={(e) => setTempMedical(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. Asthma, peanut allergy, none..."
              rows={2}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-555 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingField(null)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveMedical}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-brand-orange-500 hover:bg-brand-orange-600 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between group/label">
              <h3 className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                Medical & Allergies
              </h3>
              {canManage && editingField === null && (
                <button
                  type="button"
                  onClick={() => {
                    setTempMedical(medical);
                    setEditingField("medical");
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
                  title="Edit Medical & Allergies"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {medical ? (
              <p className="text-zinc-855 dark:text-zinc-200 font-medium leading-relaxed mt-1">
                {medical}
              </p>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 italic mt-1">
                Nothing is added
              </p>
            )}
          </>
        )}
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Notes Section */}
      <div className="space-y-1">
        {editingField === "notes" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Notes
              </label>
            </div>
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. Any general notes about behavior, attendance..."
              rows={2}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-555 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingField(null)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-355 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveNotes}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-brand-orange-500 hover:bg-brand-orange-600 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between group/label">
              <h3 className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                Notes
              </h3>
              {canManage && editingField === null && (
                <button
                  type="button"
                  onClick={() => {
                    setTempNotes(notes);
                    setEditingField("notes");
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
                  title="Edit Notes"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {notes ? (
              <p className="text-zinc-855 dark:text-zinc-200 font-medium leading-relaxed mt-1">
                {notes}
              </p>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 italic mt-1">
                Nothing is added
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
