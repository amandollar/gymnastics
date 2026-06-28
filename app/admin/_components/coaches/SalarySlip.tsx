// SalarySlip — printable salary slip component designed for A4 size paper.
import React from "react";

export interface SalarySlipData {
  coach: {
    id?: string;
    name: string;
    contactNumber: string;
    email: string | null;
    joinDate: Date | string;
    timing: string | null;
    specialization: string | null;
    baseFixedSalary?: number;
    fixedSalary: number;
    role: "COACH" | "STAFF";
  };
  academyProfile: {
    email: string | null;
    phone: string | null;
    phone2: string | null;
    address: string | null;
    website?: string | null;
  };
  year: number;
  month: number;
  workingDays: number;
  absentDays: number;
  deduction: number;
  ptEarnings: number;
  netPayout: number;
  isPaid: boolean;
  paidAt: string | Date | null;
  ptStudentsBreakdown: {
    studentName: string;
    studentNumber: number;
    planMonths: number;
    totalFee: number;
    commissionPercent: number;
    coachShare: number;
    monthlyAmount: number;
    pricePerSession: number;
    daysAttended: number;
  }[];
}

function formatINRSalary(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDateSalary(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SalarySlip({
  data,
}: {
  data: SalarySlipData;
}) {
  const {
    coach,
    academyProfile,
    year,
    month,
    workingDays,
    absentDays,
    deduction,
    ptEarnings,
    netPayout,
    isPaid,
    paidAt,
    ptStudentsBreakdown,
  } = data;

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: "#ffffff",
        width: "210mm",
        height: "297mm",
        padding: "20mm 20mm 32mm 20mm",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        color: "#1e293b",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Header section (Academy Logo and Contact) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "6mm",
        }}
      >
        <img
          src="/icons/logo.webp"
          alt="TAG Logo"
          style={{
            width: "94px",
            height: "94px",
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
              color: "#1e293b",
              letterSpacing: "-0.5px",
            }}
          >
            The Academy Of Gymnastics
          </h1>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              fontSize: "11px",
              color: "#475569",
              fontWeight: 650,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg style={{ width: "14px", height: "14px", color: "#f16d28", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>
                {academyProfile.phone && academyProfile.phone2
                  ? `${academyProfile.phone} / ${academyProfile.phone2}`
                  : academyProfile.phone || academyProfile.phone2 || "7977177463 / 7757965651"}
              </span>
            </div>
            {academyProfile.email && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <svg style={{ width: "14px", height: "14px", color: "#f16d28", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{academyProfile.email}</span>
              </div>
            )}
            {academyProfile.website && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <svg style={{ width: "14px", height: "14px", color: "#f16d28", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{academyProfile.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address and Invoice Details */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10mm",
          borderBottom: "2px solid #f1f5f9",
          paddingBottom: "4mm",
        }}
      >
        <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "45%" }}>
          {academyProfile.address ? (
            academyProfile.address.split("\n").map((line, idx) => (
              <p key={idx} style={{ margin: 0, lineHeight: 1.4 }}>{line}</p>
            ))
          ) : (
            <>
              <p style={{ margin: 0 }}>Office No 7, 2nd floor, Nine Hills Plaza</p>
              <p style={{ margin: 0 }}>opposite Tribeca High street NIBM Annexe</p>
              <p style={{ margin: 0 }}>Pune 411060</p>
            </>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: "12px", color: "#334155" }}>
          <h2
            style={{
              margin: "0 0 4px",
              fontWeight: 800,
              fontSize: "18px",
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Salary Slip
          </h2>
          <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#f16d28", fontSize: "13px" }}>
            {monthLabel}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
            Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Employee Details Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "8mm",
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "13px",
          color: "#334155",
        }}
      >
        <div>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#0f172a" }}>Employee Name:</strong> {coach.name}
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#0f172a" }}>Employee ID:</strong> {coach.id ? coach.id.slice(-8).toUpperCase() : "N/A"}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#0f172a" }}>Designation:</strong> {coach.role === "COACH" ? "Coach / Trainer" : "Staff Employee"}
          </p>
        </div>
        <div>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#0f172a" }}>Joining Date:</strong> {formatDateSalary(coach.joinDate)}
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#0f172a" }}>Contact Number:</strong> {coach.contactNumber}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#0f172a" }}>Email:</strong> {coach.email || "N/A"}
          </p>
        </div>
      </div>

      {/* Payout Breakdown Section */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.5px",
          }}
        >
          Pay Breakdown
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginBottom: "8mm",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
              <th style={{ padding: "8px 0", fontWeight: 700, color: "#475569" }}>Description</th>
              <th style={{ padding: "8px 0", fontWeight: 700, color: "#475569", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px 0", color: "#0f172a", fontWeight: 500 }}>
                Fixed Salary
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                  {coach.baseFixedSalary && coach.baseFixedSalary !== coach.fixedSalary ? (
                    <>Monthly base pay: {formatINRSalary(coach.baseFixedSalary)} (Pro-rated for joining/leaving date)</>
                  ) : (
                    <>Monthly fixed base pay</>
                  )}
                </span>
              </td>
              <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                {formatINRSalary(coach.fixedSalary)}
              </td>
            </tr>

            {deduction > 0 && (
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 0", color: "#e11d48", fontWeight: 500 }}>
                  Absent Deductions
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                    {absentDays} absent day{absentDays > 1 ? "s" : ""} out of {workingDays} working days (Daily rate: {formatINRSalary(workingDays > 0 ? Math.round(coach.fixedSalary / workingDays) : 0)}/day)
                  </span>
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#e11d48" }}>
                  -{formatINRSalary(deduction)}
                </td>
              </tr>
            )}

            {coach.role === "COACH" && (
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 0", color: "#0f172a", fontWeight: 500 }}>
                  Personal Training (PT) Commissions
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                    Total revenue split from 1-to-1 plans
                  </span>
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                  {formatINRSalary(ptEarnings)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PT Students Breakdown (only if there are student plans and employee is coach) */}
        {coach.role === "COACH" && ptStudentsBreakdown.length > 0 && (
          <div style={{ marginBottom: "8mm" }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#64748b",
                letterSpacing: "0.5px",
              }}
            >
              PT Commission Breakdown
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1.5px solid #cbd5e1", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#64748b" }}>
                  <th style={{ padding: "8px 0", fontWeight: 700 }}>Student & Calculation Formula</th>
                  <th style={{ padding: "8px 0", fontWeight: 700, textAlign: "right" }}>Coach Share</th>
                </tr>
              </thead>
              <tbody>
                {ptStudentsBreakdown.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 0" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>
                        {row.studentName} <span style={{ fontWeight: 400, color: "#64748b" }}>(TAG {row.studentNumber})</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {row.commissionPercent}% split of ({formatINRSalary(row.pricePerSession)} × {row.daysAttended} day{row.daysAttended > 1 ? "s" : ""})
                      </div>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600, color: "#0f172a", verticalAlign: "middle" }}>
                      {formatINRSalary(row.monthlyAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Net Payable Summary & Status Box */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          border: "1.5px solid #cbd5e1",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12mm",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "2px" }}>
            Payment Status
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isPaid ? "#10b981" : "#ef4444",
              }}
            />
            <span style={{ fontSize: "14px", fontWeight: 700, color: isPaid ? "#065f46" : "#991b1b" }}>
              {isPaid ? "PAID" : "UNPAID"}
            </span>
            {isPaid && paidAt && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                on {formatDateSalary(paidAt)}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "2px" }}>
            Net Payable
          </span>
          <span style={{ fontSize: "24px", fontWeight: 900, color: "#f16d28" }}>
            {formatINRSalary(netPayout)}
          </span>
        </div>
      </div>

      {/* Signature and Footer Section */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingTop: "8mm",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
          }}
        >
          <div style={{ textAlign: "center", width: "180px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src="/saif-tamboli-sign.webp"
              alt="Authorized Signature"
              style={{
                width: "120px",
                height: "auto",
                maxHeight: "60px",
                objectFit: "contain",
                marginBottom: "4px",
              }}
            />
            <div style={{ borderTop: "1.5px solid #cbd5e1", width: "100%", paddingTop: "6px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Authorized Signatory
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              The Academy Of Gymnastics
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            borderTop: "1px dashed #cbd5e1",
            paddingTop: "8px",
            textAlign: "center",
            fontSize: "10px",
            color: "#64748b",
            marginTop: "12px",
          }}
        >
          This is a computer-generated salary slip and does not require a physical signature.
        </div>
      </div>
    </div>
  );
}
