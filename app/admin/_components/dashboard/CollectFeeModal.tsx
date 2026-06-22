"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { searchStudentsWithDuesAction, collectFeeAction } from "@/lib/actions/payments";

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  handlePrint: (paymentId: string) => void;
}

export default function CollectFeeModal({
  isOpen,
  onClose,
  handlePrint,
}: CollectFeeModalProps) {
  // Collect Fee states
  const [feeSearchQuery, setFeeSearchQuery] = useState("");
  const [feeSelectedStudent, setFeeSelectedStudent] = useState<any | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeMethod, setFeeMethod] = useState("UPI");
  const [feeNotes, setFeeNotes] = useState("Fees once paid are non-refundable.\nPlease renew on or before expiry date.");
  const [feeSuccess, setFeeSuccess] = useState(false);
  const [feeLastPaymentId, setFeeLastPaymentId] = useState<string | null>(null);
  const [feeStudentsList, setFeeStudentsList] = useState<any[]>([]);
  const [allFeeStudents, setAllFeeStudents] = useState<any[]>([]);
  const [feeSearching, setFeeSearching] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  // Preload students with outstanding dues on mount
  useEffect(() => {
    setFeeSearching(true);
    searchStudentsWithDuesAction("")
      .then((res) => {
        setAllFeeStudents(res);
        setFeeStudentsList(res);
      })
      .finally(() => {
        setFeeSearching(false);
      });
  }, []);

  // Filter students based on search query
  useEffect(() => {
    const q = feeSearchQuery.trim().toLowerCase();
    if (!q) {
      setFeeStudentsList(allFeeStudents);
      return;
    }

    const filtered = allFeeStudents.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(q);
      const idMatch = s.studentNumber.toString().startsWith(q);
      return nameMatch || idMatch;
    });

    filtered.sort((a, b) => {
      const aStr = a.studentNumber.toString();
      const bStr = b.studentNumber.toString();

      if (aStr === q && bStr !== q) return -1;
      if (bStr === q && aStr !== q) return 1;

      const aStarts = aStr.startsWith(q);
      const bStarts = bStr.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      const aNameStarts = a.name.toLowerCase().startsWith(q);
      const bNameStarts = b.name.toLowerCase().startsWith(q);
      if (aNameStarts && !bNameStarts) return -1;
      if (bNameStarts && !aNameStarts) return 1;

      return 0;
    });

    setFeeStudentsList(filtered);
  }, [feeSearchQuery, allFeeStudents]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-2xl p-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">
              Collect Student Fee
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {feeSuccess ? (
          <div className="py-6 text-center flex flex-col items-center">
            <span className="h-12 w-12 rounded-full bg-brand-orange-500 text-white flex items-center justify-center shrink-0 shadow-md mb-4 animate-scale-in">
              <Check className="h-6 w-6" strokeWidth={3} />
            </span>
            <h4 className="font-bold text-lg text-brand-orange-600 dark:text-brand-orange-400">
              Payment Recorded!
            </h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 px-4 max-w-sm">
              Amount of ₹{feeAmount} has been credited to {feeSelectedStudent?.name}'s account.
            </p>
            <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-left w-full text-xs">
              <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 pb-2">
                <span className="text-zinc-400 dark:text-zinc-500">Student:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{feeSelectedStudent?.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 py-2">
                <span className="text-zinc-400 dark:text-zinc-500">Amount Paid:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{feeAmount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 py-2">
                <span className="text-zinc-400 dark:text-zinc-500">Method:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {feeMethod === "BANK_TRANSFER" ? "Bank Transfer" : feeMethod}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-zinc-400 dark:text-zinc-500">Transaction Date:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{new Date().toLocaleDateString("en-IN")}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (feeLastPaymentId) {
                    handlePrint(feeLastPaymentId);
                    onClose();
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-orange-500 text-white hover:bg-brand-orange-600 transition-colors cursor-pointer text-center"
              >
                Print Receipt
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!feeSelectedStudent || !feeAmount) return;
              setFeeSubmitting(true);
              const formData = new FormData();
              formData.append("studentPlanId", feeSelectedStudent.activePlanId);
              formData.append("studentId", feeSelectedStudent.id);
              formData.append("amount", feeAmount);
              formData.append("method", feeMethod);
              formData.append("notes", feeNotes);

              try {
                const res = await collectFeeAction(null, formData);
                if (res.success && res.paymentId) {
                  setFeeLastPaymentId(res.paymentId);
                  setFeeSuccess(true);
                } else {
                  alert(res.message || "Failed to record payment");
                }
              } catch (err) {
                alert("An error occurred while recording payment.");
              } finally {
                setFeeSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            
            {/* Search Student Autocomplete */}
            {!feeSelectedStudent ? (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Search Student with Dues *
                </label>
                <input
                  type="text"
                  value={feeSearchQuery}
                  onChange={(e) => setFeeSearchQuery(e.target.value)}
                  placeholder="Type student name or ID..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                />

                {/* Autocomplete Dropdown */}
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto border border-zinc-100 dark:border-zinc-850 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950">
                  {feeSearching ? (
                    <p className="text-[10px] text-zinc-400 p-2">Searching...</p>
                  ) : feeStudentsList.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 p-2">No students with outstanding dues found.</p>
                  ) : (
                    feeStudentsList.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setFeeSelectedStudent(student);
                          setFeeAmount(student.outstanding.toString());
                        }}
                        className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            ID: {student.studentNumber} · {student.planType}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-rose-500">
                          Dues: ₹{student.outstanding.toLocaleString("en-IN")}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-brand-orange-500/20 bg-brand-orange-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-orange-500 dark:text-brand-orange-400 uppercase tracking-wider">
                    Selected Student
                  </p>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                    {feeSelectedStudent.name} (ID: {feeSelectedStudent.studentNumber})
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Plan Outstanding Dues: ₹{feeSelectedStudent.outstanding.toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeeSelectedStudent(null)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer text-center"
                >
                  Change
                </button>
              </div>
            )}

            {/* Amount, Method and Date */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Amount Collected (INR) *
                </label>
                <input
                  type="number"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 8640"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={feeMethod}
                  onChange={(e) => setFeeMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="OTHER">Other Method</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Payment Notes
                </label>
                <textarea
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  placeholder="Enter optional payment details, bank reference, etc..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-850 pt-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!feeSelectedStudent || feeSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors cursor-pointer text-center ${
                  feeSelectedStudent && !feeSubmitting
                    ? "bg-brand-orange-500 hover:bg-brand-orange-600"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
              >
                {feeSubmitting ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
