import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MentorsPageClient from "@/components/mentors/MentorsPageClient";

export default async function MentorsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl min-w-0 w-full">
      <MentorsPageClient />
    </div>
  );
}
