import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import EnquiryListClient from "@/app/admin/_components/enquiries/EnquiryListClient";
import { listEnquiries } from "@/lib/services/cached";
import { getAcademyProfile } from "@/lib/services/academy";

export default async function EnquiriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const [enquiries, academyProfile] = await Promise.all([
    listEnquiries(),
    getAcademyProfile(),
  ]);

  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <EnquiryListClient
        canManage={canManage}
        enquiries={JSON.parse(JSON.stringify(enquiries))}
        academyProfile={JSON.parse(JSON.stringify(academyProfile))}
      />
    </div>
  );
}
