"use client";

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  IdCard,
  Phone,
} from "lucide-react";

type CoachData = {
  id: string;
  name: string;
  contactNumber: string;
  email: string | null;
  avatarUrl: string | null;
  role: "COACH" | "STAFF";
  specialization?: string | null;
};

type AcademyProfileData = {
  email: string | null;
  phone: string | null;
  phone2: string | null;
  address: string | null;
  website?: string | null;
};

export default function EmployeeIDCardClient({
  coach,
  academyProfile,
  backUrl,
}: {
  coach: CoachData;
  academyProfile: AcademyProfileData;
  backUrl?: string;
}) {
  const [frontQr, setFrontQr] = useState<string>("");

  const avatarUrl = useMemo(() => {
    if (coach.avatarUrl) return coach.avatarUrl;
    return coach.role === "STAFF"
      ? "/icons/staff-profile-placeholder.webp"
      : "/icons/coach-profile-placeholder.webp";
  }, [coach]);

  // Split name for styled rendering (first name / rest of name)
  const { firstName, lastName } = useMemo(() => {
    const parts = coach.name.trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }, [coach.name]);

  // Format ID number matching the Salary Slip format (last 8 chars of CUID)
  const formattedId = useMemo(() => {
    return coach.id.slice(-8).toUpperCase();
  }, [coach.id]);

  // Generate QR code locally
  useEffect(() => {
    const attendanceUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/admin/coaches/${coach.id}`
        : `/admin/coaches/${coach.id}`;

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
      .catch((err) => console.error("Coach QR generation error:", err));
  }, [coach.id]);

  return (
    <div className="min-h-screen bg-zinc-955 text-zinc-100 flex flex-col items-center justify-between pb-12 sm:pb-16 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-brand-orange-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] aspect-square rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Header controls (No print) */}
      <header className="no-print w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between z-10">
        <Link
          href={backUrl || `/admin/coaches/${coach.id}`}
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
        <div className="print-area flex flex-col items-center justify-center w-full max-w-4xl">
          {/* CARD FRONT (CR80 scale: 1.5858 aspect ratio) */}
          <div className="id-card-wrap relative rounded-[1.5em] overflow-hidden shadow-2xl shrink-0 bg-white select-none">
            {/* Background Graphic Template */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/Id-card/front-graphic-employee.webp"
                alt="Employee Front Background"
                fill
                sizes="300px"
                priority
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Top Left: Logo */}
            <div className="absolute top-[1.4em] left-[1.6em] z-10 w-[4.5em] h-[2.7em]">
              <Image
                src="/Id-card/dark-logo.webp"
                alt="TAG Logo"
                fill
                sizes="70px"
                priority
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Employee Photo (Centered top) */}
            <div className="absolute top-[5.2em] left-1/2 -translate-x-1/2 z-10 w-[7.4em] h-[7.4em]">
              <div className="w-full h-full rounded-full p-[0.18em] bg-[#f05a22] shadow-lg">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 relative">
                  <Image
                    src={avatarUrl}
                    alt={coach.name}
                    fill
                    sizes="110px"
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Name, Details & QR Code Container (Flowing vertically to prevent overlap) */}
            <div className="absolute top-[13.2em] left-[1.5em] right-[1.5em] z-10 flex flex-col items-center text-center">
              {/* Employee Name */}
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[1.25em] font-black text-zinc-950 uppercase tracking-wide break-words">
                  {firstName}
                </span>
                {lastName && (
                  <span className="text-[1.25em] font-black text-[#f05a22] uppercase tracking-wide break-words">
                    {lastName}
                  </span>
                )}
              </div>

              {/* Decorative line with center square */}
              <div className="w-[8.5em] flex items-center justify-center mt-[0.3em] relative">
                <div className="w-full h-[1px] bg-[#f05a22]" />
                <div className="absolute w-[1.5em] h-[3px] bg-zinc-950 rounded-[1px]" />
              </div>

              {/* Role Title */}
              <span className="text-[0.62em] font-extrabold tracking-[0.2em] text-zinc-500 mt-[0.35em] uppercase">
                {coach.role === "COACH" ? "Coach" : "Staff"}
              </span>

              {/* QR Code with Viewfinder Frame */}
              <div className="mt-[0.1em] shrink-0">
                <div className="relative p-[0.45em]">
                  {/* Viewfinder borders */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#f05a22]" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#f05a22]" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#f05a22]" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#f05a22]" />

                  <div className="w-[6.4em] h-[6.4em] bg-white p-[0.1em]">
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
            </div>

            {/* ID & Contact Details (Side-by-side, no titles, transparent background icons) */}
            <div className="absolute top-[25.8em] left-[1.5em] right-[1.5em] z-10 flex justify-between items-center px-[0.6em]">
              {/* ID No. */}
              <div className="flex items-center gap-[0.4em] text-[0.58em] font-semibold text-zinc-950 leading-none">
                <IdCard className="w-[1.375em] h-[1.375em] text-[#f05a22] shrink-0" />
                <span>{formattedId}</span>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-[0.4em] text-[0.58em] font-semibold text-zinc-950 leading-none">
                <Phone className="w-[1.375em] h-[1.375em] text-[#f05a22] shrink-0" />
                <span>{coach.contactNumber}</span>
              </div>
            </div>

            {/* Bottom Footer Website */}
            <div className="absolute bottom-[0.55em] left-0 right-0 z-10 text-center px-[1.2em]">
              <p className="text-[0.58em] font-semibold text-white lowercase tracking-wide truncate">
                {academyProfile.website || "www.academy.com"}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Instructions footer (No print) */}
      <footer className="no-print text-center text-xs text-zinc-500 leading-relaxed max-w-md px-4 mt-4">
        Tip: Print in portrait mode on an A4 sheet. Cut the card front, then
        laminate for a professional standard plastic ID card.
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
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
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
