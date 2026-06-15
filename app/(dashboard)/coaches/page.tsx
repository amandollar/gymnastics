import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import CoachesPageClient from "@/components/coaches/CoachesPageClient";

export default async function CoachesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl min-w-0 w-full">
      <CoachesPageClient />
    </div>
  );
}
