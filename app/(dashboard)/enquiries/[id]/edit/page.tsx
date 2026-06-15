import { redirect, notFound } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import EditEnquiryForm from "@/components/enquiries/EditEnquiryForm";
import { getEnquiryById } from "@/lib/services/enquiries";

export default async function EditEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && user?.role !== "MANAGER") redirect("/dashboard");

  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <EditEnquiryForm enquiry={JSON.parse(JSON.stringify(enquiry))} />
    </div>
  );
}
