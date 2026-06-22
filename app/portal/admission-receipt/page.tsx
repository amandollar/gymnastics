import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/students";
import { prisma } from "@/lib/prisma";
import { AdmissionReceipt } from "@/app/admin/_components/students/studentProfile/AdmissionReceipt";

export const metadata = {
  title: "Admission Receipt — The Academy Of Gymnastics",
};

export default async function PortalAdmissionReceiptPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/portal/login");
  }

  const [student, academyProfile] = await Promise.all([
    getStudentById(user.id),
    prisma.academyProfile.findFirst(),
  ]);

  if (!student || !student.registrationFee || student.registrationFee <= 0) {
    notFound();
  }

  const profileData = academyProfile || {
    id: "default",
    email: "info@academyofgymnastics.com",
    phone: "+91 7977177463",
    phone2: "+91 7757965651",
    address: "Office No 7, 2nd floor, Nine Hills Plaza\nopposite Tribeca High street NIBM Annexe\nPune 411060",
    website: "www.academyofgymnastics.com",
    updatedAt: new Date(),
  };

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
      <AdmissionReceipt student={student} academyProfile={profileData} />
    </>
  );
}
