"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, MessageSquare, Loader2, Check, AlertCircle, Printer, Calendar, User, ArrowRight } from "lucide-react";
import { getStudentReceiptDetailsAction, sendWhatsAppMessageAction, uploadReceiptImageAction, uploadMediaToWhatsAppAction } from "@/lib/actions/whatsapp";
import { generateStudentCredentialsAction } from "@/lib/actions/students";
import { getAcademyTemplatesAction } from "@/lib/actions/academy";
import { resolveTemplate, getEffectiveTemplate } from "@/lib/utils/whatsapp-templates";
import { getPortalBaseUrl } from "@/lib/utils/portal-url";
import { AdmissionReceipt } from "./studentProfile/AdmissionReceipt";
import StudentAvatar from "./StudentAvatar";

interface AdmissionSuccessModalProps {
  isOpen: boolean;
  studentId: string;
  studentName: string;
  studentNumber: number;
  avatarUrl?: string | null;
  gender?: string | null;
  registrationFee?: number;
}

export default function AdmissionSuccessModal({
  isOpen,
  studentId,
  studentName,
  studentNumber,
  avatarUrl,
  gender,
  registrationFee = 0,
}: AdmissionSuccessModalProps) {
  const router = useRouter();

  // WhatsApp and Credentials States
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSuccess, setWaSuccess] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  const [studentData, setStudentData] = useState<any>(null);
  const [academyProfile, setAcademyProfile] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [attachReceipt, setAttachReceipt] = useState(true);
  const [parentPhone, setParentPhone] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Load details and auto-generate credentials if needed
  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      setLoadingCreds(true);
      setWaError(null);
      try {
        const detailsRes = await getStudentReceiptDetailsAction(studentId);
        if (!detailsRes.success || !detailsRes.student) {
          throw new Error(detailsRes.message || "Failed to load student details");
        }

        const student = detailsRes.student;
        setStudentData(student);
        setAcademyProfile(detailsRes.academyProfile);
        setParentPhone(student.contactNumber || "");

        // Fetch templates
        const templatesRes = await getAcademyTemplatesAction();
        let customTemplate = null;
        let portalUrl = null;
        if (templatesRes.success) {
          customTemplate = (templatesRes.templates as any)?.templateAdmissionWelcome;
          portalUrl = templatesRes.parentPortalUrl;
        }

        // Generate temporary password if not set
        let passwordStr = "";
        if (!student.password) {
          const credsRes = await generateStudentCredentialsAction(studentId);
          if (credsRes.success && credsRes.tempPassword) {
            setTempPassword(credsRes.tempPassword);
            passwordStr = credsRes.tempPassword;
          }
        } else if (student.isTempPassword) {
          passwordStr = "[Temporary Password Active]";
        } else {
          passwordStr = "[Parent Defined Password]";
        }

        // Resolve welcome text
        const loginUrl = `${getPortalBaseUrl(portalUrl, detailsRes.academyProfile?.website)}/portal/login`;
        const rollNumber = `TAG${String(student.studentNumber).padStart(3, "0")}`;
        const template = getEffectiveTemplate(customTemplate, "templateAdmissionWelcome");
        
        const resolved = resolveTemplate(template, {
          parentName: student.parentName || "Parent",
          studentName: student.name,
          loginId: rollNumber,
          password: passwordStr,
          portalLink: loginUrl,
        });

        setMessageText(resolved);
      } catch (err) {
        console.error("Failed to load credentials/receipt info:", err);
        setWaError(err instanceof Error ? err.message : "Failed to load student data");
      } finally {
        setLoadingCreds(false);
      }
    };

    init();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  // Manual WhatsApp Fallback Web Redirect
  const handleWaWebFallback = () => {
    const cleaned = (parentPhone ?? "").replace(/\D/g, "");
    const formattedNum = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${formattedNum}?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  // Direct WhatsApp Notify Handler
  const handleWhatsAppNotify = async () => {
    if (!parentPhone) {
      setWaError("Parent phone number is required.");
      return;
    }
    setSendingWa(true);
    setWaError(null);
    setWaSuccess(false);

    try {
      let uploadedMediaId: string | undefined;

      // 1. Draw receipt image from HTML DOM, wrap in PDF, & upload directly to Meta Media API if checked
      if (attachReceipt && printRef.current && studentData) {
        const html2canvas = (await import("html2canvas-pro")).default;
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

        // Dynamically import jsPDF to keep main bundle size small
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Add the high-res canvas image to the A4 page (210mm x 297mm)
        doc.addImage(dataUrl, "JPEG", 0, 0, 210, 297);

        // Get standard base64 Data URI string of the PDF
        const pdfDataUri = doc.output("datauristring");
        const rawBase64 = pdfDataUri.substring(pdfDataUri.indexOf(",") + 1);
        const pdfDataUrl = `data:application/pdf;base64,${rawBase64}`;

        const rollNumber = `TAG${String(studentNumber).padStart(3, "0")}`;
        const filename = `Receipt_${rollNumber}.pdf`;

        const uploadRes = await uploadMediaToWhatsAppAction(pdfDataUrl, filename);
        if (!uploadRes.success || !uploadRes.id) {
          throw new Error(uploadRes.message || "Failed to upload receipt PDF to WhatsApp servers");
        }
        uploadedMediaId = uploadRes.id;
      }

      // 2. Call server action to send WhatsApp
      const rollNumber = `TAG${String(studentNumber).padStart(3, "0")}`;
      const sendRes = await sendWhatsAppMessageAction({
        to: parentPhone,
        type: uploadedMediaId ? "document" : "text",
        text: messageText,
        mediaId: uploadedMediaId,
        filename: `Receipt_${rollNumber}.pdf`,
        caption: messageText,
        studentId: studentId,
        templateName: "Admission Welcome",
      });

      if (!sendRes.success) {
        throw new Error(sendRes.message || "Meta WhatsApp API returned an error");
      }

      setWaSuccess(true);
    } catch (err) {
      console.error("WhatsApp notification error:", err);
      setWaError(err instanceof Error ? err.message : "Failed to send message via WhatsApp Cloud API");
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in animate-duration-200">
      <div
        className="w-full max-w-[550px] rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800/80 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in animate-duration-200"
        style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500/5 via-white dark:via-zinc-900 to-orange-500/5 px-6 py-5 shrink-0 border-b border-zinc-100/60 dark:border-zinc-800/40 flex items-center justify-between gap-4">
          
          {/* Integrated Student Details (Horizontal layout) */}
          <div className="flex items-center gap-4 min-w-0">
            <StudentAvatar
              student={{
                id: studentId,
                name: studentName,
                studentNumber,
                avatarUrl,
                gender,
              }}
              size={56}
              className="ring-2 ring-zinc-100 dark:ring-zinc-800 shadow-sm shrink-0"
            />
            <div className="min-w-0 text-left">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-555 truncate">
                {studentName}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">ID: TAG{String(studentNumber).padStart(3, "0")}</span>
                {registrationFee > 0 && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-zinc-650 dark:text-zinc-450 font-semibold">Fee Paid: ₹{registrationFee.toLocaleString("en-IN")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Success Badge on Right */}
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-bold text-xs shrink-0 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-100/50 dark:border-emerald-900/20">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
              <Check className="h-2.5 w-2.5" strokeWidth={4} />
            </div>
            <span>Admitted</span>
          </div>
        </div>

        {/* Hidden container for rendering HTML receipt to capture */}
        {studentData && (
          <div style={{ position: "absolute", left: "-9999px", top: "-9999px", overflow: "hidden", height: 0, width: 0 }}>
            <div ref={printRef} style={{ width: "210mm", height: "297mm", background: "#ffffff" }}>
              <AdmissionReceipt
                student={{
                  name: studentName,
                  studentNumber,
                  dateOfBirth: studentData.dateOfBirth,
                  parentName: studentData.parentName || "",
                  contactNumber: studentData.contactNumber || "",
                  admissionDate: studentData.admissionDate,
                  registrationFee: registrationFee,
                }}
                academyProfile={academyProfile || {
                  email: null,
                  phone: null,
                  phone2: null,
                  address: null,
                  website: null,
                }}
              />
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 min-h-0">

          {/* Action 1: Notify via WhatsApp */}
          <div className="rounded-2xl p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-450 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Notify via WhatsApp</h3>
              </div>
              {!loadingCreds && !waSuccess && (
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="text-xs text-brand-orange-500 hover:text-brand-orange-600 font-semibold cursor-pointer border-0 bg-transparent"
                >
                  {isEditingMessage ? "Hide template" : "Edit template"}
                </button>
              )}
            </div>

            {isEditingMessage && !loadingCreds && !waSuccess && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2.5 resize-none focus:outline-none focus:border-brand-orange-500 transition-colors leading-relaxed"
                  placeholder="Customize welcome message..."
                />
              </div>
            )}

            {loadingCreds ? (
              <div className="py-4 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span className="text-xs text-zinc-500">Preparing message details...</span>
              </div>
            ) : waSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150/40 dark:border-emerald-900/40 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                <span>Notification message and receipt delivered successfully!</span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* Phone verification input */}
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={parentPhone}
                    disabled
                    placeholder="Enter parent mobile number"
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-100 dark:bg-zinc-800/40 px-3.5 py-2 text-xs font-mono text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={sendingWa || !parentPhone}
                    onClick={handleWhatsAppNotify}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-550 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer border-0"
                  >
                    {sendingWa ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Notify Now</span>
                    )}
                  </button>
                </div>

                {/* Attach receipt toggle */}
                {registrationFee > 0 && (
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachReceipt}
                      onChange={(e) => setAttachReceipt(e.target.checked)}
                      className="rounded border-zinc-300 text-brand-orange-500 focus:ring-brand-orange-500 accent-brand-orange-500"
                    />
                    <span>Attach Receipt PDF to the message</span>
                  </label>
                )}

                {/* WhatsApp Error message with fallback link */}
                {waError && (
                  <div className="p-3 bg-rose-50/50 dark:bg-rose-955/10 border border-rose-150/40 dark:border-rose-900/40 rounded-xl space-y-2">
                    <div className="flex gap-2 text-rose-700 dark:text-rose-450 text-xs leading-relaxed">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <span className="font-bold">Failed to send direct WhatsApp:</span>
                        <p className="mt-0.5 text-[11px]">{waError}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-rose-600 dark:text-rose-450 font-medium">Use backup manual send instead:</span>
                      <button
                        type="button"
                        onClick={handleWaWebFallback}
                        className="px-2.5 py-1 bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer border-0"
                      >
                        Open WhatsApp Web
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action 2: Print Registration Receipt */}
          {registrationFee > 0 && (
            <div className="rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950/40 text-brand-orange-500">
                  <Printer className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Print Admission Receipt</h3>
              </div>
              <a
                href={`/admin/students/${studentId}/admission-receipt`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Print Receipt
              </a>
            </div>
          )}

          {/* Action 3: Continue to Assign Plan */}
          <div className="rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-500">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Assign Training Plan</h3>
            </div>
            <Link
              href={`/admin/plans?student=${studentId}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer border-0"
            >
              <span>Assign Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-55/30 dark:bg-zinc-900/30 flex items-center justify-end shrink-0">
          <button
            onClick={() => {
              router.push("/admin/students");
              router.refresh();
            }}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-500 dark:text-zinc-400 text-sm font-semibold rounded-2xl transition-colors cursor-pointer border border-zinc-200/40 dark:border-zinc-750"
          >
            Finish & Go to List
          </button>
        </div>
      </div>
    </div>
  );
}
