import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import CoachProfileClient from "@/app/admin/_components/coaches/CoachProfileClient";
import { getCoachById } from "@/lib/services/coaches";

export const metadata = {
  title: "Coach Profile — TAG CRM",
  description: "View coach attendance, personal training assignments, and earnings.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const coach = await getCoachById(id);

  if (!coach) {
    notFound();
  }

  // Generate todayStr formatted as YYYY-MM-DD for initial calendar views
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <CoachProfileClient
        coach={JSON.parse(JSON.stringify(coach))}
        todayStr={todayStr}
      />
    </div>
  );
}
