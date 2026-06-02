import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import EditEnquiryForm from "@/components/enquiries/EditEnquiryForm";
import { getEnquiryById } from "@/lib/services/enquiries";

export default async function EditEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");
  
  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <EditEnquiryForm enquiry={JSON.parse(JSON.stringify(enquiry))} />
    </div>
  );
}
