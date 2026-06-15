import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import AddEnquiryForm from "@/components/enquiries/AddEnquiryForm";

export default async function NewEnquiryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && user?.role !== "MANAGER") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <AddEnquiryForm />
    </div>
  );
}
