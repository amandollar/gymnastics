import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getFinanceForExport } from "@/lib/services/export";

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
    const data = await getFinanceForExport(from, to);

    // Generate CSV string
    const headers = [
      "Date",
      "Type",
      "Reference",
      "Party Name",
      "Description",
      "Method",
      "Amount",
      "Status",
    ];

    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.date,
          row.type,
          row.reference,
          `"${row.partyName.replace(/"/g, '""')}"`,
          `"${row.description.replace(/"/g, '""')}"`,
          row.method,
          row.amount,
          row.status,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const dateSuffix = from && to ? `_${from}_to_${to}` : "";
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=finance_ledger_export${dateSuffix}_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("Export finance error:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}
