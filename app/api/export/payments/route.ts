import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getPaymentsForExport } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  try {
    const data = await getPaymentsForExport(from, to);

    // Generate CSV string
    const headers = [
      "Invoice Number",
      "Student Number",
      "Student Name",
      "Amount",
      "Method",
      "Paid At",
      "Notes",
    ];

    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.invoiceNumber,
          row.studentNumber,
          `"${row.studentName.replace(/"/g, '""')}"`,
          row.amount,
          row.method,
          row.paidAt,
          `"${row.notes.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const dateSuffix = from && to ? `_${from}_to_${to}` : "";
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=payments_export${dateSuffix}_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("Export payments error:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}
