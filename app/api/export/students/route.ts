import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getStudentsForExport } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";

  try {
    const data = await getStudentsForExport(status);

    // Generate CSV string
    const headers = [
      "Student Number",
      "Name",
      "Date of Birth",
      "Gender",
      "Parent Name",
      "Contact Number",
      "Admission Date",
      "Level",
      "Status",
      "Notes",
    ];

    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.studentNumber,
          `"${row.name.replace(/"/g, '""')}"`,
          row.dateOfBirth,
          row.gender,
          `"${row.parentName.replace(/"/g, '""')}"`,
          `"${row.contactNumber.replace(/"/g, '""')}"`,
          row.admissionDate,
          row.level,
          row.status,
          `"${row.notes.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=students_export_${status.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("Export students error:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}
