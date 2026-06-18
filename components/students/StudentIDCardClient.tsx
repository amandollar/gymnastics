"use client";

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  IdCard,
  Users,
  Phone,
  Calendar,
  Dumbbell,
  Clock,
  MapPin,
  Mail,
  Globe,
} from "lucide-react";
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
    batch?: {
      id: string;
      name: string;
      timing: string;
    } | null;
  } | null;
};

function formatStudentId(num: number): string {
  const padded = String(num).padStart(3, "0");
  return `TAG${padded}`;
}

export default function StudentIDCardClient({
  student,
  academyProfile,
}: {
  student: StudentData;
  academyProfile: {
    email: string | null;
    phone: string | null;
    phone2: string | null;
    address: string | null;
    website?: string | null;
  };
}) {
  const [frontQr, setFrontQr] = useState<string>("");
  const [backQr, setBackQr] = useState<string>("");

  const avatarUrl = useMemo(() => {
    return getStudentAvatarUrl({
      id: student.id,
      name: student.name,
      studentNumber: student.studentNumber,
      avatarUrl: student.avatarUrl,
      gender: student.gender,
    });
  }, [student]);

  const dateOfBirthText = useMemo(() => {
    return new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [student.dateOfBirth]);

  const statusText = useMemo(() => {
    return String(student.status).replace(/_/g, " ");
  }, [student.status]);

  // Split name for styled rendering (first name / rest of name)
  const { firstName, lastName } = useMemo(() => {
    const parts = student.name.trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }, [student.name]);

  // Generate QR codes locally
  // Both front and back encode the same student attendance URL.
  // The attendance scanner in handleScanSuccess() already handles the
  // "/students/<id>" path — it extracts the student ID directly and calls
  // markAttendance(studentId) without any extra DB lookup. This makes scanning
  // from either side of the card instant and reliable.
  useEffect(() => {
    const attendanceUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/students/${student.id}`
        : `/students/${student.id}`;

    // Front QR: slightly smaller but same data, compact margin for the smaller box
    QRCode.toDataURL(attendanceUrl, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setFrontQr(url))
      .catch((err) => console.error("Front QR generation error:", err));

    // Back QR: larger render for the bigger display box
    QRCode.toDataURL(attendanceUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setBackQr(url))
      .catch((err) => console.error("Back QR generation error:", err));
  }, [student]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-between pb-12 sm:pb-16 relative overflow-hidden">
      {/* Decorative background glow */}
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
          {/* ── CARD FRONT (CR80 scale: 1.5858 aspect ratio) ── */}
          <div className="id-card-wrap relative rounded-[1.5em] overflow-hidden shadow-2xl shrink-0 bg-white select-none">
            {/* Background Graphic Template */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/Id-card/front-graphic.webp"
                alt="Front Background"
                fill
                sizes="300px"
                priority
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Top Left: Logo (Smaller) */}
            <div className="absolute top-[1.4em] left-[1.6em] z-10 w-[3.2em] h-[3.2em]">
              <Image
                src="/logo.webp"
                alt="TAG Logo"
                fill
                sizes="50px"
                priority
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Student Photo (Shifted more towards left) */}
            <div className="absolute top-[6.8em] right-[3.2em] z-10 w-[7.4em] h-[7.4em]">
              <div className="w-full h-full rounded-full p-[0.18em] bg-[#f05a22] shadow-lg">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 relative">
                  <Image
                    src={avatarUrl}
                    alt={student.name}
                    fill
                    sizes="110px"
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Student Name & Details Flow Container */}
            <div className="absolute top-[13.4em] left-[1.6em] right-[1.6em] z-10 flex flex-col gap-[0.7em]">
              {/* Student Name */}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[1.25em] font-black text-zinc-950 uppercase tracking-wide break-words">
                  {firstName}
                </span>
                {lastName && (
                  <span className="text-[1.25em] font-black text-[#f05a22] uppercase tracking-wide break-words">
                    {lastName}
                  </span>
                )}
                <span className="text-[0.55em] font-bold tracking-[0.2em] text-zinc-500 mt-[0.3em] uppercase">
                  Student
                </span>
              </div>

              {/* Details List (Cleaner, no icons, slightly more compact) */}
              <div className="flex flex-col gap-[0.3em]">
                {/* ID NO */}
                <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                  <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">
                    ID No.
                  </span>
                  <span className="text-zinc-400 mr-[0.5em] font-medium">
                    :
                  </span>
                  <span className="text-zinc-950 font-black truncate">
                    {formatStudentId(student.studentNumber)}
                  </span>
                </div>

                {/* Parent Name */}
                <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                  <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">
                    Parent
                  </span>
                  <span className="text-zinc-400 mr-[0.5em] font-medium">
                    :
                  </span>
                  <span className="text-zinc-950 font-black truncate">
                    {student.parentName}
                  </span>
                </div>

                {/* Contact */}
                <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                  <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">
                    Contact
                  </span>
                  <span className="text-zinc-400 mr-[0.5em] font-medium">
                    :
                  </span>
                  <span className="text-zinc-950 font-black truncate">
                    {student.contactNumber}
                  </span>
                </div>

                {/* DOB */}
                <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                  <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">
                    DOB
                  </span>
                  <span className="text-zinc-400 mr-[0.5em] font-medium">
                    :
                  </span>
                  <span className="text-zinc-950 font-black truncate">
                    {dateOfBirthText}
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline (Bottom Left) */}
            <div className="absolute bottom-[1.8em] left-[1.6em] border-l-[0.15em] border-[#f05a22] pl-[0.5em] text-left leading-[1.1] z-10">
              <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">
                Focus.
              </p>
              <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">
                Practice.
              </p>
              <p className="text-[0.52em] font-black text-[#f05a22] uppercase tracking-wider">
                Achieve.
              </p>
            </div>

            {/* QR Code (Bottom Right, Larger, no URL below) */}
            <div className="absolute bottom-[1.5em] right-[1.6em] z-10">
              <div className="w-[4.7em] h-[4.7em]">
                {frontQr ? (
                  <img
                    src={frontQr}
                    alt="Front QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 animate-pulse rounded" />
                )}
              </div>
            </div>
          </div>

          {/* ── CARD BACK ── */}
          <div className="id-card-wrap relative rounded-[1.5em] overflow-hidden shadow-2xl shrink-0 bg-zinc-950 select-none">
            {/* Background Graphic */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/Id-card/back-graphic.webp"
                alt="Back Background"
                fill
                sizes="300px"
                priority
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Top Center: Logo (Dark Logo Version) */}
            <div className="absolute top-[2.5em] left-1/2 -translate-x-1/2 z-10 w-[5.9em] h-[3.5em]">
              <Image
                src="/Id-card/dark-logo.webp"
                alt="TAG Dark Logo"
                fill
                sizes="95px"
                priority
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Slogan */}
            <div className="absolute top-[6.0em] left-0 right-0 text-center w-full z-10 uppercase tracking-wider font-black leading-tight">
              <p className="text-[0.60em] text-white">Empowering Athletes.</p>
              <p className="text-[0.60em] text-[#f05a22]">
                Building Champions.
              </p>
            </div>

            {/* Center QR Code (Large) */}
            <div className="absolute top-[8.8em] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center justify-center">
              <div className="relative w-[8.0em] h-[8.0em]">
                {backQr ? (
                  <img
                    src={backQr}
                    alt="Back QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 animate-pulse" />
                )}
              </div>
            </div>

            {/* Contact & Address info (relocated to dark area) */}
            <div className="absolute top-[18.0em] left-[1.8em] right-[1.8em] text-left z-10 flex flex-col gap-[0.45em]">
              {/* Row 1: Address */}
              <div className="flex items-start gap-[0.4em] w-full">
                <MapPin className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0 mt-[0.05em]" />
                <span className="text-[0.48em] font-extrabold text-white leading-normal">
                  {(academyProfile.address || "Office No 7, 2nd floor, Nine Hills Plaza\nopposite Tribeca High street NIBM Annexe\nPune 411060").replace(/\n/g, " , ")}
                </span>
              </div>
              {/* Row 2: Phone */}
              <div className="flex items-center gap-[0.4em]">
                <Phone className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" />
                <span className="text-[0.48em] font-extrabold text-white leading-none tracking-wider">
                  {academyProfile.phone && academyProfile.phone2
                    ? `${academyProfile.phone} / ${academyProfile.phone2}`
                    : academyProfile.phone || academyProfile.phone2 || "7977177463 / 7757965651"}
                </span>
              </div>
              {/* Row 3: Email */}
              {academyProfile.email && (
                <div className="flex items-center gap-[0.4em]">
                  <Mail className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" />
                  <span className="text-[0.48em] font-extrabold text-white leading-none lowercase">
                    {academyProfile.email}
                  </span>
                </div>
              )}
              {/* Row 4: Website */}
              {academyProfile.website && (
                <div className="flex items-center gap-[0.4em]">
                  <Globe className="w-[0.8em] h-[0.8em] text-[#f05a22] shrink-0" />
                  <span className="text-[0.48em] font-extrabold text-white leading-none lowercase">
                    {academyProfile.website}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Footer Strip: Terms & Conditions relocated as para */}
            <div className="absolute bottom-[1.4em] left-0 right-0 z-10 flex flex-col items-center justify-center px-[1.6em]">
              <p className="text-[0.48em] font-extrabold text-zinc-700 leading-[1.3] text-center max-w-[92%]">
                * Property of The Academy of Gymnastics. Must be displayed on premises. Non-transferable. If found, return to the nearest TAG center.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Instructions footer (No print) */}
      <footer className="no-print text-center text-xs text-zinc-500 leading-relaxed max-w-md px-4 mt-4">
        Tip: Print in portrait mode on an A4 sheet. Fold the front and back
        cards, then laminate for a professional standard plastic ID card.
      </footer>

      {/* Custom Styles for Clamping, Layout and Printing */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .id-card-wrap {
          font-family: 'Inter', system-ui, sans-serif;
          width: 18.75em;
          height: 29.734em;
          font-size: 16px;
          position: relative;
          overflow: hidden;
          background: white;
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
            font-size: 2.8789mm !important; /* Scale to exactly 53.98mm wide */
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body::-webkit-scrollbar {
            display: none;
          }
        }
      `,
        }}
      />
    </div>
  );
}
