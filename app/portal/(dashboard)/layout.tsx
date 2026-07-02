import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById, getAcademyProfile } from "@/lib/services/cached";
import { prisma } from "@/lib/prisma";
import PortalLayoutClient from "@/app/portal/_components/PortalLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/parents/login");
  }

  const [student, academyProfile, notifications] = await Promise.all([
    getStudentById(user.id),
    getAcademyProfile(),
    prisma.notification.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!student) {
    redirect("/parents/login");
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
    email: "contact@academy.com",
    phone: "+91 9999999999",
    phone2: "+91 9999999999",
    address: "Academy Address\nCity, State\nPincode",
    website: "www.academy.com",
    updatedAt: new Date(),
  };

  return (
    <PortalLayoutClient
      student={JSON.parse(JSON.stringify(student))}
      siblings={JSON.parse(JSON.stringify(siblings))}
      academyProfile={JSON.parse(JSON.stringify(profileData))}
      initialNotifications={JSON.parse(JSON.stringify(notifications))}
    >
      {children}
    </PortalLayoutClient>
  );
}
