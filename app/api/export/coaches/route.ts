import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getCoachesForExport } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await getCoachesForExport();

    // Generate CSV string
    const headers = [
      "Name",
      "Contact Number",
      "Email",
      "Role",
      "Status",
      "Fixed Salary",
      "Timing",
      "Specialization",
      "Address",
      "Join Date",
      "Notes",
    ];

    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.contactNumber.replace(/"/g, '""')}"`,
          `"${row.email.replace(/"/g, '""')}"`,
          row.role,
          row.status,
          row.fixedSalary,
          `"${row.timing.replace(/"/g, '""')}"`,
          `"${row.specialization.replace(/"/g, '""')}"`,
          `"${row.address.replace(/"/g, '""')}"`,
          row.joinDate,
          `"${row.notes.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=coaches_export_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("Export coaches error:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}
