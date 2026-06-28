import { redirect } from 'next/navigation';

export default function PortalPage() {
  // Redirect to the portal login page
  redirect('/portal/login');
}
