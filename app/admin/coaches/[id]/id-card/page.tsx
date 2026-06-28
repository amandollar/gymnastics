import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getCoachById } from "@/lib/services/coaches";
import { getAcademyProfile } from "@/lib/services/academy";
import EmployeeIDCardClient from "@/app/admin/_components/coaches/EmployeeIDCardClient";

export default async function EmployeeIDCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [coach, academyProfile] = await Promise.all([
    getCoachById(id),
    getAcademyProfile(),
  ]);

  if (!coach) notFound();

  return (
    <EmployeeIDCardClient
      coach={JSON.parse(JSON.stringify(coach))}
      academyProfile={JSON.parse(JSON.stringify(academyProfile))}
    />
  );
}
