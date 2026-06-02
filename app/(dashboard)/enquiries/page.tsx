import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EnquiryListClient from "@/components/enquiries/EnquiryListClient";
import { listEnquiries } from "@/lib/services/enquiries";

export default async function EnquiriesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";
  const enquiries = await listEnquiries();
  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <EnquiryListClient
        canManage={canManage}
        enquiries={JSON.parse(JSON.stringify(enquiries))}
      />
    </div>
  );
}
