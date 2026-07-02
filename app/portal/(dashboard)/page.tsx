import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById, getAcademyProfile } from "@/lib/services/cached";
import OverviewTab from "@/app/portal/_components/OverviewTab";

export default async function OverviewPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/parents/login");
  }

  const [student, academyProfile] = await Promise.all([
    getStudentById(user.id),
    getAcademyProfile(),
  ]);

  if (!student) {
    redirect("/parents/login");
  }

  if (student.isTempPassword) {
    redirect("/parents/settings/change-password");
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
    <OverviewTab
      student={JSON.parse(JSON.stringify(student))}
      academyProfile={JSON.parse(JSON.stringify(profileData))}
    />
  );
}
