import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AddEnquiryForm from "@/components/enquiries/AddEnquiryForm";

export default async function NewEnquiryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl min-w-0 w-full">
      <AddEnquiryForm />
    </div>
  );
}
