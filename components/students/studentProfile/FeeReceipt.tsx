// FeeReceipt — printable receipt matching the TAG sample design
// Designed exactly for A4 size paper.

interface ReceiptData {
  invoiceNumber: number;
  paidAt: Date | string;
  amount: number;
  method: string;
  notes: string | null;
  student: {
    name: string;
    studentNumber: number;
    dateOfBirth: Date | string;
    parentName: string;
    contactNumber: string;
  };
  studentPlan: {
    planType: string;
    totalSessions: number;
    planMonths: number | null;
    startDate: Date | string;
    endDate: Date | string;
    fee: number;
    discountPercent: number;
    payments?: { amount: number }[];
  };
}

function formatINRReceipt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
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

function getMethodLabel(method: string) {
  switch (method) {
    case "UPI":
      return "UPI";
    case "CASH":
      return "cash";
    case "BANK_TRANSFER":
      return "bank transfer";
    default:
      return method.toLowerCase();
  }
}

export function FeeReceipt({ data }: { data: ReceiptData }) {
  const { invoiceNumber, paidAt, amount, method, notes, student, studentPlan } =
    data;
  const discountPercent = studentPlan.discountPercent;
  const invoiceLabel = String(invoiceNumber).padStart(3, "0");
  const age = getAgeYears(student.dateOfBirth);

  // Calculate plan details and period
  const startStr = formatDateReceipt(studentPlan.startDate);
  const endStr = formatDateReceipt(studentPlan.endDate);
  const durationLabel = studentPlan.planMonths
    ? `${studentPlan.planMonths} Month${studentPlan.planMonths !== 1 ? "s" : ""} Plan`
    : `${studentPlan.planType === "ONE_TO_ONE" ? "Personal" : "Group"} Plan`;

  const pricePerClass =
    studentPlan.totalSessions > 0
      ? formatINRReceipt(
          Math.round(studentPlan.fee / studentPlan.totalSessions),
        )
      : "—";

  // Calculate fee breakdown (Base Fee -> Discount -> Total Fee)
  const finalFee = studentPlan.fee;
  const originalFee =
    discountPercent > 0
      ? Math.round(finalFee / (1 - discountPercent / 100))
      : finalFee;
  const discountAmount = originalFee - finalFee;

  // Calculate total payments and remaining dues
  const paymentsList = studentPlan.payments || [];
  const totalPaidForPlan = paymentsList.reduce((sum, p) => sum + p.amount, 0);
  const remainingDues = Math.max(0, studentPlan.fee - totalPaidForPlan);
  const isPaidCompletely = remainingDues <= 0;

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
      {/* ── Top Row: Logo & Title ── */}
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
          src="/logo.webp"
          alt="TAG Logo"
          style={{
            width: "94px",
            height: "94px",
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
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
      </div>

      {/* ── Second Row: Invoice count, date, location & contact (aligned to right) ── */}
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
            Invoice {invoiceLabel}
          </p>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            {formatDateReceipt(paidAt)}
          </p>
          <p style={{ margin: 0 }}>Office No 7, 2nd floor, Nine Hills Plaza</p>
          <p style={{ margin: 0 }}>opposite Tribeca High street NIBM Annexe</p>
          <p style={{ margin: "0 0 6px" }}>Pune 411060</p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Contact no: 7977177463 / 7757965651
          </p>
        </div>
      </div>

      {/* ── Student Details ── */}
      <div style={{ marginBottom: "8mm", fontSize: "14px", color: "#0f172a" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", fontWeight: 700, width: "120px" }}>
                {student.name}
              </td>
              <td style={{ padding: "4px 0" }}>Age: {age} yr</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#475569" }}>
                Student ID:
              </td>
              <td style={{ padding: "4px 0", fontWeight: 600 }}>
                TAG{String(student.studentNumber).padStart(3, "0")}
              </td>
            </tr>
            {student.parentName && (
              <tr>
                <td style={{ padding: "4px 0", color: "#475569" }}>
                  Parent Name:
                </td>
                <td style={{ padding: "4px 0", fontWeight: 600 }}>
                  {student.parentName}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "4px 0", color: "#475569" }}>
                Contact No:
              </td>
              <td style={{ padding: "4px 0" }}>{student.contactNumber}</td>
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
            {/* Main Plan Item Row */}
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
                  {durationLabel}
                </p>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    lineHeight: "1.6",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Duration: {startStr} - {endStr}
                  </p>
                  <p style={{ margin: 0 }}>Price per class: {pricePerClass}</p>
                </div>
              </td>
              <td
                style={{
                  padding: "16px 8px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {studentPlan.totalSessions}
              </td>
              <td
                style={{
                  padding: "16px 0",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatINRReceipt(originalFee)}
              </td>
            </tr>

            {/* Discount Row (if any) */}
            {discountPercent > 0 && (
              <>
                <tr style={{ verticalAlign: "top" }}>
                  <td></td>
                  <td
                    style={{
                      padding: "8px 8px",
                      fontSize: "12px",
                      color: "#16a34a",
                      fontWeight: 600,
                    }}
                  >
                    {discountPercent}% Discount applied
                  </td>
                  <td></td>
                  <td
                    style={{
                      padding: "8px 0",
                      textAlign: "right",
                      fontSize: "13px",
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    - {formatINRReceipt(discountAmount)}
                  </td>
                </tr>

                {/* Subtotal Row (only shown when calculation was needed) */}
                <tr style={{ borderTop: "1px dashed #cbd5e1" }}>
                  <td></td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    Total Plan Fee
                  </td>
                  <td></td>
                  <td
                    style={{
                      padding: "12px 0",
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {formatINRReceipt(finalFee)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Total Row: Paid amount vs Dues calculation summary ── */}
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
          <span style={{ color: "#475569" }}>Payment through: </span>
          <span style={{ fontWeight: 600 }}>{getMethodLabel(method)}</span>
        </p>
        <div style={{ textAlign: "right", lineHeight: "1.6" }}>
          {isPaidCompletely ? (
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
                  {formatINRReceipt(finalFee)}
                </span>
              </p>
              <span
                style={{
                  fontWeight: 700,
                  color: "#16a34a",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                Payment Completed (No Dues)
              </span>
            </div>
          ) : (
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "13px",
                color: "#334155",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "2px 0",
                      textAlign: "left",
                      width: "140px",
                    }}
                  >
                    Plan Price:
                  </td>
                  <td
                    style={{
                      padding: "2px 0",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {formatINRReceipt(finalFee)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "2px 0",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Amount Paid:
                  </td>
                  <td
                    style={{
                      padding: "2px 0",
                      textAlign: "right",
                      fontWeight: 750,
                      color: "#0f172a",
                      fontSize: "14px",
                    }}
                  >
                    {formatINRReceipt(amount)}
                  </td>
                </tr>
                <tr style={{ borderTop: "1px dashed #cbd5e1" }}>
                  <td
                    style={{
                      padding: "6px 0 2px 0",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#e11d48",
                    }}
                  >
                    Dues Remaining:
                  </td>
                  <td
                    style={{
                      padding: "6px 0 2px 0",
                      textAlign: "right",
                      fontWeight: 750,
                      color: "#e11d48",
                    }}
                  >
                    {formatINRReceipt(remainingDues)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
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
            {notes ||
              "Fees once paid are non-refundable.\nPlease renew on or before expiry date."}
          </p>
        </div>

        {/* Signature Line */}
        <div style={{ textAlign: "center", width: "200px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Signature Image Container */}
          <div
            style={{
              height: "45px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              marginBottom: "4px",
            }}
          >
            <img
              src="/saif-tamboli-sign.webp"
              alt="Signature"
              style={{
                maxHeight: "100%",
                maxWidth: "140px",
                objectFit: "contain",
              }}
            />
          </div>
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
            (ALISHA SAIF TAMBOLI)
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
