import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/students";
import { prisma } from "@/lib/prisma";
import PortalDashboardClient from "@/app/portal/_components/PortalDashboardClient";

export default async function PortalDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/portal/login");
  }

  const [student, academyProfile] = await Promise.all([
    getStudentById(user.id),
    prisma.academyProfile.findFirst(),
  ]);

  if (!student) {
    redirect("/portal/login");
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
    <PortalDashboardClient
      student={JSON.parse(JSON.stringify(student))}
      academyProfile={JSON.parse(JSON.stringify(profileData))}
    />
  );
}
