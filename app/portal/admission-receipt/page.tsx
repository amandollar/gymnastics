import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById, getAcademyProfile } from "@/lib/services/cached";
import { AdmissionReceipt } from "@/app/admin/_components/students/studentProfile/AdmissionReceipt";

export const metadata = {
  title: "Admission Receipt — The Academy Of Gymnastics",
};

export default async function PortalAdmissionReceiptPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/parents/login");
  }

  const [student, academyProfile] = await Promise.all([
    getStudentById(user.id),
    getAcademyProfile(),
  ]);

  if (!student || !student.registrationFee || student.registrationFee <= 0) {
    notFound();
  }

  const profileData = academyProfile || {
    id: "default",
    email: "contact@academy.com",
    phone: "+91 9999999999",
    phone2: "+91 9999999999",
    address: "Academy Address\nCity, State\nPincode",
    website: "www.academy.com",
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
