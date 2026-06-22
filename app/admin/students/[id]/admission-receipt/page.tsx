import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/students";
import { getAcademyProfile } from "@/lib/services/academy";
import { AdmissionReceipt } from "@/app/admin/_components/students/studentProfile/AdmissionReceipt";

export const metadata = {
  title: "Admission Receipt — The Academy Of Gymnastics",
};

export default async function AdmissionReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [student, academyProfile] = await Promise.all([
    getStudentById(id),
    getAcademyProfile(),
  ]);

  if (!student || !student.registrationFee || student.registrationFee <= 0) {
    notFound();
  }

  return (
    <>
      {/* Auto-print on load */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          `,
        }}
      />
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
      <AdmissionReceipt student={student} academyProfile={academyProfile} />
    </>
  );
}
