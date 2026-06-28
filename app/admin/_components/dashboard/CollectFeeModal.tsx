"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, Search, ArrowLeft } from "lucide-react";
import { searchStudentsWithDuesAction, collectFeeAction, getPaymentByIdAction } from "@/lib/actions/payments";
import WhatsAppModal from "@/app/admin/_components/common/WhatsAppModal";
import { buildFeeReminderMessage, buildPaymentReceivedMessage } from "@/lib/utils/whatsapp-templates";
import { uploadMediaToWhatsAppAction, sendWhatsAppMessageAction } from "@/lib/actions/whatsapp";
import { FeeReceipt } from "@/app/admin/_components/students/studentProfile/FeeReceipt";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  handlePrint: (paymentId: string) => void;
  academyProfile?: any;
}

type SortOption = "DUE_DESC" | "ADMISSION_ASC";

export default function CollectFeeModal({
  isOpen,
  onClose,
  handlePrint,
  academyProfile,
}: CollectFeeModalProps) {
  // Collect Fee states
  const [feeSearchQuery, setFeeSearchQuery] = useState("");
  const [feeSelectedStudent, setFeeSelectedStudent] = useState<any | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeMethod, setFeeMethod] = useState("UPI");
  const [feeNotes, setFeeNotes] = useState("Fees once paid are non-refundable.\nPlease renew on or before expiry date.");
  const [feeSuccess, setFeeSuccess] = useState(false);
  const [feeLastPaymentId, setFeeLastPaymentId] = useState<string | null>(null);
  
  const [allFeeStudents, setAllFeeStudents] = useState<any[]>([]);
  const [feeSearching, setFeeSearching] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("DUE_DESC");
  const [feePaymentData, setFeePaymentData] = useState<Awaited<ReturnType<typeof getPaymentByIdAction>> | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // WhatsApp states
  const [waModal, setWaModal] = useState<{ open: boolean; message: string; title: string; templateName?: string; studentId?: string; contactNumber?: string }>({
    open: false,
    message: "",
    title: "Send WhatsApp Message",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Preload students with outstanding dues on mount
  useEffect(() => {
    if (isOpen) {
      setFeeSearching(true);
      searchStudentsWithDuesAction("")
        .then((res) => {
          setAllFeeStudents(res);
        })
        .finally(() => {
          setFeeSearching(false);
        });
    } else {
      setTimeout(() => {
        setFeeSelectedStudent(null);
        setFeeSuccess(false);
        setFeeAmount("");
        setFeePaymentData(null);
        setFeeLastPaymentId(null);
      }, 300);
    }
  }, [isOpen]);

  // Filter & Sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = allFeeStudents;
    const q = feeSearchQuery.trim().toLowerCase();
    
    if (q) {
      filtered = allFeeStudents.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const idMatch = s.studentNumber.toString().startsWith(q);
        return nameMatch || idMatch;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "DUE_DESC") {
        return b.outstanding - a.outstanding;
      } else {
        // ADMISSION_ASC
        const dateA = a.planStartDate ? new Date(a.planStartDate).getTime() : 0;
        const dateB = b.planStartDate ? new Date(b.planStartDate).getTime() : 0;
        return dateA - dateB;
      }
    });

    return sorted;
  }, [allFeeStudents, feeSearchQuery, sortOption]);

  const handleOpenWhatsApp = (student: any) => {
    // Generate message
    const plan = {
      planType: student.planType,
      fee: student.totalFee,
      outstanding: student.outstanding,
    };
    const msg = buildFeeReminderMessage({
      student,
      plan: plan as any,
      template: academyProfile?.templateFeeReminder,
    });
    setWaModal({ 
      open: true, 
      message: msg, 
      title: "Send Fee Reminder", 
      templateName: "Fee Reminder",
      studentId: student.id,
      contactNumber: student.contactNumber,
    });
  };

  const handleCollectClick = (student: any) => {
    setFeeSelectedStudent(student);
    setFeeAmount(student.outstanding.toString());
  };

  const handleSendReceipt = async () => {
    if (!feeSelectedStudent || !feePaymentData || !printRef.current) return;
    setSendingReceipt(true);
    
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.addImage(dataUrl, "JPEG", 0, 0, 210, 297);
      const pdfDataUri = doc.output("datauristring");
      const rawBase64 = pdfDataUri.substring(pdfDataUri.indexOf(",") + 1);
      const pdfDataUrl = `data:application/pdf;base64,${rawBase64}`;

      const rollNumber = `TAG${String(feeSelectedStudent.studentNumber).padStart(3, "0")}`;
      const filename = `Receipt_${rollNumber}.pdf`;

      const uploadRes = await uploadMediaToWhatsAppAction(pdfDataUrl, filename);
      if (!uploadRes.success || !uploadRes.id) {
        throw new Error(uploadRes.message || "Failed to upload receipt PDF");
      }

      const msg = buildPaymentReceivedMessage({
        student: feeSelectedStudent,
        payment: {
          amountPaid: Number(feeAmount),
          method: feeMethod,
          date: new Date(),
          newOutstanding: feeSelectedStudent.outstanding - Number(feeAmount),
        },
        template: academyProfile?.templatePaymentReceived,
      });

      const res = await sendWhatsAppMessageAction({
        to: feeSelectedStudent.contactNumber,
        type: "document",
        caption: msg,
        mediaId: uploadRes.id,
        filename,
        studentId: feeSelectedStudent.id,
        templateName: "Payment Received",
      });

      if (res.success) {
        onClose();
        showToast("success", "Receipt sent successfully via WhatsApp!");
      } else {
        throw new Error(res.message || "Failed to send message");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while sending the receipt");
    } finally {
      setSendingReceipt(false);
    }
  };

  return (
    <>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="absolute inset-0" onClick={onClose} />
        <div 
          className={`relative z-10 w-full ${feeSuccess || feeSelectedStudent ? "max-w-lg" : "max-w-4xl"} rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              {feeSelectedStudent && !feeSuccess && (
                <button
                  type="button"
                  onClick={() => setFeeSelectedStudent(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="text-lg font-bold text-zinc-955 dark:text-zinc-50">
                {feeSuccess ? "Payment Successful" : feeSelectedStudent ? "Collect Student Fee" : "Students with Dues"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {feeSuccess ? (
            <div className="py-6 text-center flex flex-col items-center overflow-y-auto">
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

              <div className="mt-6 flex flex-wrap sm:flex-nowrap gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-center order-3 sm:order-1"
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
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-center order-2"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleSendReceipt}
                  disabled={sendingReceipt}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-orange-500 text-white hover:bg-brand-orange-600 transition-colors cursor-pointer text-center flex items-center justify-center gap-2 order-1 sm:order-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReceipt ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                  ) : (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                    </svg>
                  )}
                  {sendingReceipt ? "Sending..." : "Send Receipt"}
                </button>
              </div>
            </div>
          ) : feeSelectedStudent ? (
            <div className="overflow-y-auto flex-1 pb-2">
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
                      const pData = await getPaymentByIdAction(res.paymentId);
                      setFeePaymentData(pData);
                      setFeeLastPaymentId(res.paymentId);
                      setFeeSuccess(true);
                    } else {
                      showToast("error", res.message || "Failed to record payment");
                    }
                  } catch (err) {
                    showToast("error", "An error occurred while recording payment.");
                  } finally {
                    setFeeSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl border border-brand-orange-500/20 bg-brand-orange-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {feeSelectedStudent.avatarUrl ? (
                      <Image
                        src={feeSelectedStudent.avatarUrl}
                        alt={feeSelectedStudent.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover shrink-0 w-12 h-12 border border-zinc-200 dark:border-zinc-700 bg-white"
                      />
                    ) : (
                      <Image
                        src={feeSelectedStudent.gender === "FEMALE" ? "/icons/women.webp" : "/icons/man.webp"}
                        alt={feeSelectedStudent.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover shrink-0 w-12 h-12 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                      />
                    )}
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {feeSelectedStudent.name} 
                        <span className="text-xs font-medium text-zinc-500 ml-1">(ID: {feeSelectedStudent.studentNumber})</span>
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                        Outstanding Dues: ₹{feeSelectedStudent.outstanding.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Amount Collected (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      placeholder="e.g. 8640"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Payment Method
                    </label>
                    <select
                      value={feeMethod}
                      onChange={(e) => setFeeMethod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 cursor-pointer"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CASH">Cash Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="OTHER">Other Method</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Payment Notes
                    </label>
                    <textarea
                      value={feeNotes}
                      onChange={(e) => setFeeNotes(e.target.value)}
                      placeholder="Enter optional payment details, bank reference, etc..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-5 mt-5">
                  <button
                    type="button"
                    onClick={() => setFeeSelectedStudent(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!feeSelectedStudent || feeSubmitting}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-colors cursor-pointer ${
                      feeSelectedStudent && !feeSubmitting
                        ? "bg-brand-orange-500 hover:bg-brand-orange-600"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {feeSubmitting ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 shrink-0">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={feeSearchQuery}
                    onChange={(e) => setFeeSearchQuery(e.target.value)}
                    placeholder="Search by name or TAG ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-zinc-500 hidden sm:inline-block">Sort by:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 cursor-pointer shadow-xs transition-all"
                  >
                    <option value="DUE_DESC">Highest Dues First</option>
                    <option value="ADMISSION_ASC">Oldest Admission First</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm relative">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Student</th>
                      <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Joined Date</th>
                      <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Dues</th>
                      <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {feeSearching ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0"></div>
                              <div className="space-y-2 w-full">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 animate-pulse"></div>
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-32 animate-pulse"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20 animate-pulse"></div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-16 animate-pulse ml-auto"></div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-2.5">
                              <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
                              <div className="w-20 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredAndSortedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
                          No students with outstanding dues found.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                          <td className="px-5 py-3.5">
                            <Link href={`/admin/students/${student.id}`} onClick={onClose} className="flex items-center gap-3 group/link">
                              {student.avatarUrl ? (
                                <Image
                                  src={student.avatarUrl}
                                  alt={student.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover shrink-0 w-10 h-10 border border-zinc-200 dark:border-zinc-700 bg-white shadow-xs group-hover/link:ring-2 group-hover/link:ring-brand-orange-500/50 transition-all"
                                />
                              ) : (
                                <Image
                                  src={student.gender === "FEMALE" ? "/icons/women.webp" : "/icons/man.webp"}
                                  alt={student.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover shrink-0 w-10 h-10 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-xs group-hover/link:ring-2 group-hover/link:ring-brand-orange-500/50 transition-all"
                                />
                              )}
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover/link:text-brand-orange-500 transition-colors">{student.name}</p>
                                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  TAG{String(student.studentNumber).padStart(3, "0")} · {student.planType === "ONE_TO_ONE" ? "Personal" : "Group"}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                            {student.planStartDate ? new Date(student.planStartDate).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="font-bold text-rose-600 dark:text-rose-450 text-[15px] bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg inline-block shadow-xs border border-rose-100 dark:border-rose-900/50">
                              ₹{student.outstanding.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(student)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450 dark:hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs border border-emerald-100 dark:border-emerald-900/30 hover:scale-105 active:scale-95"
                                title="Send WhatsApp Reminder"
                              >
                                <svg
                                  className="w-4.5 h-4.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCollectClick(student)}
                                className="px-3.5 py-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                              >
                                Collect Fee
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <WhatsAppModal
        isOpen={waModal.open}
        onClose={() => setWaModal((prev) => ({ ...prev, open: false }))}
        contactNumber={waModal.contactNumber || ""}
        defaultMessageText={waModal.message}
        title={waModal.title}
        studentId={waModal.studentId}
        templateName={waModal.templateName}
      />

      {/* Hidden Receipt for PDF Generation */}
      {feeSuccess && feePaymentData && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
          <div ref={printRef} style={{ width: "210mm", height: "297mm", backgroundColor: "#fff" }}>
            <FeeReceipt data={feePaymentData} academyProfile={academyProfile} />
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[9999] rounded-2xl border px-4 py-3.5 text-xs font-semibold shadow-lg max-w-sm transition-all duration-300 animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/30"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
