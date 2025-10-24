import { redirect } from 'next/navigation';

// This page is now obsolete and just redirects to the home page.
export default function DashboardPage() {
  redirect('/');
}
