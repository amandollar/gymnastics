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
    email: "contact@academy.com",
    phone: "+91 9999999999",
    phone2: "+91 9999999999",
    address: "Academy Address\nCity, State\nPincode",
    website: "www.academy.com",
    updatedAt: new Date(),
  };

  return (
    <OverviewTab
      student={JSON.parse(JSON.stringify(student))}
      academyProfile={JSON.parse(JSON.stringify(profileData))}
    />
  );
}
