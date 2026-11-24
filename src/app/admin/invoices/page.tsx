import { redirect } from 'next/navigation';

export default function AdminInvoicesRedirectPage() {
  redirect('/admin/settlements?q=invoices');
}
