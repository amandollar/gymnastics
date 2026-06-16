import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { getPaymentById } from "@/lib/services/payments";
import { FeeReceipt } from "@/components/students/studentProfile/FeeReceipt";

export const metadata = {
  title: "Payment Receipt — The Academy Of Gymnastics",
};

export default async function FeeReceiptPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { paymentId } = await params;
  const payment = await getPaymentById(paymentId);

  if (!payment) notFound();

  return (
    <>
      {/* Auto-print on load */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          `,
        }}
      />
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
      <FeeReceipt data={payment} />
    </>
  );
}
