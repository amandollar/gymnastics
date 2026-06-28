import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById, getAcademyProfile } from "@/lib/services/cached";
import { prisma } from "@/lib/prisma";
import PortalSettingsClient from "./PortalSettingsClient";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/portal/login");
  }

  const [student, academyProfile] = await Promise.all([
    getStudentById(user.id),
    getAcademyProfile(),
  ]);

  if (!student) {
    redirect("/portal/login");
  }

  if (student.isTempPassword) {
    redirect("/portal/settings/change-password");
  }

  const siblings = await prisma.student.findMany({
    where: {
      contactNumber: student.contactNumber,
      id: { not: student.id },
    },
    select: {
      id: true,
      name: true,
      studentNumber: true,
      avatarUrl: true,
    },
  });

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
    <PortalSettingsClient
      student={JSON.parse(JSON.stringify(student))}
      siblings={JSON.parse(JSON.stringify(siblings))}
      academyProfile={JSON.parse(JSON.stringify(profileData))}
    />
  );
}
