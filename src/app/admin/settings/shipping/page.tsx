import { redirect } from 'next/navigation';

export default function AdminShippingSettingsPage() {
  redirect('/admin/deliveries?tab=shipping-zones');
}
