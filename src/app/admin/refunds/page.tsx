import { redirect } from 'next/navigation';

export default function AdminRefundsRedirectPage() {
  redirect('/admin/settlements?q=invoices');
}
