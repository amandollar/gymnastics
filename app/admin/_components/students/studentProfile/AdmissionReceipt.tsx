// AdmissionReceipt — printable admission receipt matching the FeeReceipt design
// Designed exactly for A4 size paper.

interface AdmissionReceiptData {
  admissionDate: Date | string;
  registrationFee?: number | null;
  name: string;
  studentNumber: number;
  dateOfBirth: Date | string;
  parentName: string;
  contactNumber: string;
}

function formatINRReceipt(n: number | null | undefined) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function formatDateReceipt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAgeYears(dob: Date | string) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function AdmissionReceipt({
  student,
  academyProfile,
}: {
  student: AdmissionReceiptData;
  academyProfile: {
    email: string | null;
    phone: string | null;
    phone2: string | null;
    address: string | null;
    website?: string | null;
  };
}) {
  const { name, studentNumber, dateOfBirth, parentName, contactNumber, admissionDate, registrationFee } = student;
  const receiptLabel = String(studentNumber).padStart(3, "0");
  const age = getAgeYears(dateOfBirth);

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
      {/* ── Top Row: Logo & Title with contact details row below name ── */}
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
            {/* Phone Icon & Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg style={{ width: "14px", height: "14px", color: "#f16d28", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>
                {academyProfile.phone && academyProfile.phone2
                  ? `${academyProfile.phone} / ${academyProfile.phone2}`
                  : academyProfile.phone || academyProfile.phone2 || "Contact for details"}
              </span>
            </div>

            {/* Email Icon & Details */}
            {academyProfile.email && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <svg style={{ width: "14px", height: "14px", color: "#f16d28", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="lowercase">{academyProfile.email}</span>
              </div>
            )}

            {/* Website Icon & Details */}
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

      {/* ── Second Row: Receipt count, date, location & contact (aligned to right) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12mm",
        }}
      >
        <div
          style={{
            textAlign: "right",
            fontSize: "12px",
            color: "#334155",
            lineHeight: "1.5",
          }}
        >
          <p
            style={{
              margin: "0 0 2px",
              fontWeight: 700,
              fontSize: "14px",
              color: "#0f172a",
            }}
          >
            Admission Receipt #{receiptLabel}
          </p>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            {formatDateReceipt(admissionDate)}
          </p>
          {academyProfile.address ? (
            academyProfile.address.split("\n").map((line, idx) => (
              <p key={idx} style={{ margin: 0 }}>{line}</p>
            ))
          ) : (
            <>
              <p style={{ margin: 0 }}>Office No 7, 2nd floor, Nine Hills Plaza</p>
              <p style={{ margin: 0 }}>opposite Tribeca High street NIBM Annexe</p>
              <p style={{ margin: "0 0 6px" }}>Pune 411060</p>
            </>
          )}
        </div>
      </div>

      {/* ── Student Details ── */}
      <div style={{ marginBottom: "8mm", fontSize: "14px", color: "#0f172a" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", fontWeight: 700, width: "120px" }}>
                {name}
              </td>
              <td style={{ padding: "4px 0" }}>Age: {age} yr</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#475569" }}>
                Student ID:
              </td>
              <td style={{ padding: "4px 0", fontWeight: 600 }}>
                TAG{String(studentNumber).padStart(3, "0")}
              </td>
            </tr>
            {parentName && (
              <tr>
                <td style={{ padding: "4px 0", color: "#475569" }}>
                  Parent Name:
                </td>
                <td style={{ padding: "4px 0", fontWeight: 600 }}>
                  {parentName}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "4px 0", color: "#475569" }}>
                Contact No:
              </td>
              <td style={{ padding: "4px 0" }}>{contactNumber}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Receipt Table with Calculations ── */}
      <div style={{ flex: 1 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #0f172a",
                borderTop: "2px solid #0f172a",
              }}
            >
              <th
                style={{
                  padding: "10px 0",
                  textAlign: "left",
                  fontWeight: 700,
                  width: "60px",
                }}
              >
                Sr no.
              </th>
              <th
                style={{
                  padding: "10px 8px",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: "10px 8px",
                  textAlign: "center",
                  fontWeight: 700,
                  width: "120px",
                }}
              >
                No. of Class
              </th>
              <th
                style={{
                  padding: "10px 0",
                  textAlign: "right",
                  fontWeight: 700,
                  width: "100px",
                }}
              >
                Fees
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ verticalAlign: "top" }}>
              <td style={{ padding: "16px 0", fontWeight: 700 }}>01.</td>
              <td style={{ padding: "16px 8px" }}>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  Registration Fee
                </p>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    lineHeight: "1.6",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    One-time registration fee charged at the time of admission.
                  </p>
                </div>
              </td>
              <td
                style={{
                  padding: "16px 8px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                —
              </td>
              <td
                style={{
                  padding: "16px 0",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatINRReceipt(registrationFee)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Total Row: Paid amount summary ── */}
      <div
        style={{
          borderTop: "2px solid #0f172a",
          borderBottom: "2px solid #0f172a",
          padding: "12px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "14px",
          marginBottom: "12mm",
        }}
      >
        <p style={{ margin: 0 }}>
          <span style={{ color: "#475569" }}>Status: </span>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>Payment Completed</span>
        </p>
        <div style={{ textAlign: "right", lineHeight: "1.6" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>
              Total Paid:{" "}
              <span style={{ fontSize: "18px", marginLeft: "10px" }}>
                {formatINRReceipt(registrationFee)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Notes and Signature Block ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 10,
        }}
      >
        {/* Notes */}
        <div style={{ maxWidth: "60%", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700 }}>
            Notes
          </h3>
          <p
            style={{
              margin: 0,
              color: "#334155",
              fontStyle: "italic",
              lineHeight: "1.5",
              whiteSpace: "pre-line",
            }}
          >
            One-time registration fees are completely non-refundable and non-transferable under any circumstances.
          </p>
        </div>

        {/* Signature Line */}
        <div style={{ textAlign: "center", width: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Signature space */}
          <div
            style={{
              height: "45px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              marginBottom: "4px",
            }}
          />
          <div
            style={{
              width: "100%",
              borderBottom: "2px solid #0f172a",
              marginBottom: "8px",
            }}
          />
          <p
            style={{
              margin: "0 0 2px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.5px",
            }}
          >
            ACADEMY OWNER
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Authorized Signatory
          </p>
        </div>
      </div>

      {/* ── Decorative Orange Graphic in Bottom Left ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "250px",
          height: "80px",
          background: "#f16d28",
          borderTopRightRadius: "100%",
          zIndex: 0,
        }}
      />
    </div>
  );
}
