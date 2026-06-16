"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { getStudentAvatarUrl } from "@/lib/utils/avatar";

type StudentData = {
  id: string;
  studentNumber: number;
  name: string;
  dateOfBirth: Date | string;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date | string;
  notes: string | null;
  medicalHistory: string | null;
  avatarUrl?: string | null;
  status: string;
  activePlan?: {
    planType: string;
    expiryDate: Date | string;
  } | null;
};

// SVG standard Code 39 barcode generator
function generateCode39Svg(studentNumber: number): string {
  const CODE39_MAP: Record<string, string> = {
    "0": "N N N W W N W N N", "1": "W N N W N N N N W", "2": "N N W W N N N N W",
    "3": "W N W W N N N N N", "4": "N N N W W N N N W", "5": "W N N W W N N N N",
    "6": "N N W W W N N N N", "7": "N N N W N N W N W", "8": "W N N W N N W N N",
    "9": "N N W W N N W N N", "A": "W N N N N W N N W", "B": "N N W N N W N N W",
    "C": "W N W N N W N N N", "D": "N N N N W W N N W", "E": "W N N N W W N N N",
    "F": "N N W N W W N N N", "G": "N N N N N W W N W", "H": "W N N N N W W N N",
    "I": "N N W N N W W N N", "J": "N N N N W W W N N", "K": "W N N N N N N W W",
    "L": "N N W N N N N W W", "M": "W N W N N N N W N", "N": "N N N N W N N W W",
    "O": "W N N N W N N W N", "P": "N N W N W N N W N", "Q": "N N N N N N W W W",
    "R": "W N N N N N N W W", "S": "N N W N N N N W W", "T": "N N N N W N N W W",
    "U": "W W N N N N N N W", "V": "N W W N N N N N W", "W": "W W W N N N N N N",
    "X": "N W N N W N N N W", "Y": "W W N N W N N N N", "Z": "N W W N N W N N N",
    "-": "N W N N N N W N W", ".": "W W N N N N W N N", " ": "N W W N N N W N N",
    "*": "N W N N W N W N N",
  };

  const paddedNum = String(studentNumber).padStart(3, "0");
  const value = `TAG${paddedNum}`;
  const code = `*${value}*`;
  
  let x = 0;
  const rects: string[] = [];
  const narrowWidth = 1.5;
  const wideWidth = 3.5;
  const barHeight = 45;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP["*"];
    const elements = pattern.split(" ");
    
    for (let j = 0; j < elements.length; j++) {
      const type = elements[j];
      const isBar = j % 2 === 0;
      const width = type === "W" ? wideWidth : narrowWidth;
      
      if (isBar) {
        rects.push(`<rect x="${x}" y="0" width="${width}" height="${barHeight}" fill="black" />`);
      }
      x += width;
    }
    x += narrowWidth; // Inter-character gap
  }
  
  return `<svg width="100%" height="100%" viewBox="0 0 ${x} ${barHeight}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects.join("")}</svg>`;
}

function formatStudentId(num: number): string {
  const padded = String(num).padStart(3, "0");
  return `TAG${padded}`;
}

export default function StudentIDCardClient({ student }: { student: StudentData }) {
  const avatarUrl = useMemo(() => {
    return getStudentAvatarUrl({
      id: student.id,
      name: student.name,
      studentNumber: student.studentNumber,
      avatarUrl: student.avatarUrl,
      gender: student.gender,
    });
  }, [student]);

  const barcodeSvg = useMemo(() => {
    return generateCode39Svg(student.studentNumber);
  }, [student.studentNumber]);

  const validTillText = useMemo(() => {
    if (student.activePlan?.expiryDate) {
      return new Date(student.activePlan.expiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return "N/A";
  }, [student.activePlan]);

  const memberSinceText = useMemo(() => {
    return new Date(student.admissionDate).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }, [student.admissionDate]);

  const dateOfBirthText = useMemo(() => {
    return new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [student.dateOfBirth]);

  const planTypeText = useMemo(() => {
    if (!student.activePlan?.planType) return "N/A";
    return student.activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class";
  }, [student.activePlan]);

  const statusText = useMemo(() => {
    return String(student.status).replace(/_/g, " ");
  }, [student.status]);

  const isMemberActive = student.status === "ACTIVE" || student.status === "GRACE" || student.status === "FREEZE";
  const footerText = isMemberActive ? "ACTIVE MEMBER" : "ACADEMY MEMBER";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-between pb-12 sm:pb-16 relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-brand-orange-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] aspect-square rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Header controls (No print) */}
      <header className="no-print w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between z-10">
        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-5.5 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-brand-orange-500/20 hover:scale-[1.02] cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print ID Card
        </button>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full z-10">
        <div className="print-area flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-4xl">
          
          {/* ── CARD FRONT (CR80 scale: 1.5857 aspect ratio) ── */}
          <div className="id-card-wrap relative w-[300px] h-[475px] rounded-[24px] overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl flex flex-col justify-between shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent pointer-events-none" />
            
            {/* 1. Student Photo (Top Position) */}
            <div className="flex flex-col items-center justify-center pt-8 px-4">
              <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-b from-brand-orange-500 to-amber-500 shadow-xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 relative border border-black/10">
                  <Image
                    src={avatarUrl}
                    alt={student.name}
                    fill
                    sizes="144px"
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* 2. Student Name & 3. Student ID (Middle Position) */}
            <div className="flex flex-col items-center text-center px-6 mt-1 flex-1 justify-center gap-2">
              <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-zinc-400">
                Student ID Card
              </span>
              <h2 className="text-[20px] font-black text-white leading-snug tracking-wide uppercase clamp-name-text">
                {student.name}
              </h2>
              <div className="text-[13px] font-semibold tracking-[0.18em] text-zinc-300 uppercase">
                {statusText}
              </div>
              <div className="text-[15px] font-black tracking-wider text-brand-orange-500">
                ID: {formatStudentId(student.studentNumber)}
              </div>
            </div>

            {/* 4. Academy Logo (Bottom Position) */}
            <div className="flex flex-col items-center gap-1 mt-auto mb-6 opacity-90">
              <Image
                src="/logo.webp"
                alt="TAG Logo"
                width={30}
                height={30}
                className="object-contain"
              />
              <span className="text-[8px] font-black tracking-[0.22em] text-zinc-400 uppercase">
                The Academy of Gymnastics
              </span>
            </div>

            {/* Bottom Footer Strip */}
            <div className="w-full bg-brand-orange-500 py-3 text-center">
              <span className="text-xs font-black tracking-[0.25em] text-white uppercase block">
                {footerText}
              </span>
            </div>
          </div>

          {/* ── CARD BACK ── */}
          <div className="id-card-wrap relative w-[300px] h-[475px] rounded-[24px] overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl flex flex-col justify-between shrink-0 px-6 py-7">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-800/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Logo watermark background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] w-48 h-48 pointer-events-none">
              <Image src="/logo.webp" alt="" width={192} height={192} className="object-contain" />
            </div>

            {/* Back Header with Academy Info & Contacts */}
            <div className="text-center pb-3 border-b border-zinc-800/80 z-10">
              <span className="text-[10px] font-black tracking-[0.24em] text-brand-orange-500 uppercase block mb-1">
                The Academy of Gymnastics
              </span>
              <p className="text-[8px] text-zinc-400 tracking-wider leading-none">
                academyofgymnastics.com &middot; +91 95959 51931
              </p>
            </div>

            {/* Info Section - High utilization grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs py-4 flex-1 items-center z-10">
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Parent Name</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5 clamp-parent-name">{student.parentName}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Emergency</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5 tabular-nums">{student.contactNumber}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Date of Birth</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5 tabular-nums">{dateOfBirthText}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Gender</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5">{student.gender}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Plan</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5">{planTypeText}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Status</dt>
                <dd className={`font-semibold mt-0.5 tabular-nums ${isMemberActive ? "text-emerald-400" : "text-zinc-200"}`}>
                  {statusText}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Valid Till</dt>
                <dd className={`font-semibold mt-0.5 tabular-nums ${isMemberActive ? "text-emerald-400" : "text-zinc-200"}`}>
                  {validTillText}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Member Since</dt>
                <dd className="font-semibold text-zinc-200 mt-0.5 tabular-nums">{memberSinceText}</dd>
              </div>
            </div>

            {/* Barcode & Footer Notice */}
            <div className="flex flex-col items-center gap-3.5 mt-auto z-10">
              <div className="bg-white p-2.5 rounded-[14px] flex flex-col items-center justify-center gap-1 w-full shadow-inner border border-zinc-200 max-w-[240px]">
                <div 
                  className="h-10 w-full" 
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }} 
                />
                <span className="text-[8px] font-mono tracking-[0.25em] text-zinc-950 font-black">
                  *TAG{String(student.studentNumber).padStart(3, "0")}*
                </span>
              </div>

              <div className="text-center space-y-1">
                <p className="text-[7.5px] text-zinc-550 leading-relaxed max-w-[240px] mx-auto">
                  This card is property of TAG. If found, please return to the academy.
                </p>
                <p className="text-[6.5px] text-zinc-600 font-bold uppercase tracking-wider">
                  © {new Date().getFullYear()} The Academy of Gymnastics
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Instructions footer (No print) */}
      <footer className="no-print text-center text-xs text-zinc-500 leading-relaxed max-w-md px-4 mt-4">
        Tip: Print in portrait mode on an A4 sheet. Fold the front and back cards, then laminate for a professional standard plastic ID card.
      </footer>

      {/* Custom Styles for Clamping and Printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Limit Student & Parent Name length to 2 lines without truncating words abruptly */
        .clamp-name-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 18px;
          line-height: 1.25;
        }

        .clamp-parent-name {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.2;
        }

        .clamp-medical-info {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media print {
          @page {
            size: portrait;
            margin: 0 !important;
          }
          
          html, body {
            background: white !important;
            color: black !important;
            min-height: 100vh !important;
            height: 100vh !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          /* CR80 Standard Layout format */
          .print-area {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 15mm !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }

          .id-card-wrap {
            width: 53.98mm !important;
            height: 85.60mm !important;
            border-radius: 3.18mm !important;
            border: 0.5px solid #27272a !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #09090b !important;
            background-image: linear-gradient(to bottom, #18181b, #09090b) !important;
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Sizing adjustments for print scaling */
          .clamp-name-text {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }

          body::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />
    </div>
  );
}
