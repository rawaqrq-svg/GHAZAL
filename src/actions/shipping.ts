'use server';

import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { JORDAN_GOVERNORATES_SHIPPING_ZONES } from '@/lib/shipping-zones';
import { getCourierCompaniesAction, setDefaultCourierCompanyAction } from '@/actions/settlements';

export interface ShippingZoneItem {
  id: string;
  nameAr: string;
  nameEn: string;
  fee: number; // Customer price in fils (سعر البيع للزبون)
  cost: number; // Our delivery company cost in fils (تكلفة الشحن علينا)
  estimatedDeliveryTime?: string;
  isEnabled: boolean;
}

const BASE_JORDAN_GOVERNORATES: ShippingZoneItem[] = JORDAN_GOVERNORATES_SHIPPING_ZONES.map(z => ({
  id: z.id,
  nameAr: z.nameAr,
  nameEn: z.nameEn,
  fee: z.fee,
  cost: z.cost || 2000,
  estimatedDeliveryTime: z.estimatedDeliveryTime || 'خلال 2 - 3 أيام عمل',
  isEnabled: z.isEnabled
}));

// Initialize company-specific rates in global memory so they persist across requests
if (!(globalThis as any).__ghazal_company_shipping_rates) {
  (globalThis as any).__ghazal_company_shipping_rates = {
    'comp-1': BASE_JORDAN_GOVERNORATES.map(z => ({
      ...z,
      fee: z.id === 'zone-amman' ? 2000 : z.id === 'zone-zarqa' ? 2500 : 3000,
      cost: z.id === 'zone-amman' ? 1500 : z.id === 'zone-zarqa' ? 1800 : 2200,
    })),
    'comp-2': BASE_JORDAN_GOVERNORATES.map(z => ({
      ...z,
      fee: z.id === 'zone-amman' ? 2500 : z.id === 'zone-zarqa' ? 3000 : 3500,
      cost: z.id === 'zone-amman' ? 2000 : z.id === 'zone-zarqa' ? 2400 : 2800,
    })),
    'comp-3': BASE_JORDAN_GOVERNORATES.map(z => ({
      ...z,
      fee: z.id === 'zone-balqa' ? 1500 : z.id === 'zone-amman' ? 2000 : 2500,
      cost: z.id === 'zone-balqa' ? 1000 : z.id === 'zone-amman' ? 1400 : 1800,
    })),
  };
}

let memoryShippingZones: ShippingZoneItem[] = BASE_JORDAN_GOVERNORATES;

async function resolveDefaultCompanyId(): Promise<string> {
  if ((globalThis as any).__ghazal_default_courier_id) {
    return (globalThis as any).__ghazal_default_courier_id;
  }
  try {
    const companies = await getCourierCompaniesAction();
    const def = companies.find(c => c.isDefaultStoreCourier) || companies[0];
    if (def) {
      (globalThis as any).__ghazal_default_courier_id = def.id;
      return def.id;
    }
  } catch {}
  return 'comp-1';
}

export async function initializeShippingZones() {
  try {
    await requirePermission('manage:settings');
    const count = await prisma.shippingZone.count();
    if (count === 0) {
      for (const gov of BASE_JORDAN_GOVERNORATES) {
        await prisma.shippingZone.create({
          data: {
            nameAr: gov.nameAr,
            nameEn: gov.nameEn,
            fee: gov.fee,
            estimatedDeliveryTime: gov.estimatedDeliveryTime || 'خلال 2 - 3 أيام عمل',
            isEnabled: true
          }
        });
      }
    }
  } catch (e) {
    console.warn('initializeShippingZones memory fallback active');
  }
}

export async function getShippingZonesForCompany(companyId?: string): Promise<ShippingZoneItem[]> {
  const targetId = companyId || await resolveDefaultCompanyId();
  const ratesMap = (globalThis as any).__ghazal_company_shipping_rates || {};
  if (!ratesMap[targetId]) {
    ratesMap[targetId] = BASE_JORDAN_GOVERNORATES.map(z => ({ ...z }));
  }
  return ratesMap[targetId];
}

export async function getAllCompanyShippingZonesAction(): Promise<{
  defaultCompanyId: string;
  rates: Record<string, ShippingZoneItem[]>;
}> {
  const defaultCompanyId = await resolveDefaultCompanyId();
  const ratesMap = (globalThis as any).__ghazal_company_shipping_rates || {};
  return {
    defaultCompanyId,
    rates: ratesMap
  };
}

export async function getShippingZonesList(): Promise<ShippingZoneItem[]> {
  try {
    const defaultId = await resolveDefaultCompanyId();
    const companyZones = await getShippingZonesForCompany(defaultId);
    if (companyZones && companyZones.length > 0) {
      return companyZones;
    }
  } catch {}

  try {
    const dbZones = await prisma.shippingZone.findMany({
      orderBy: { fee: 'asc' }
    });
    if (dbZones && dbZones.length > 0) {
      return dbZones.map((z: any) => {
        const mem = memoryShippingZones.find(m => m.id === z.id);
        const ref = BASE_JORDAN_GOVERNORATES.find(j => j.id === z.id);
        return {
          id: z.id,
          nameAr: ref?.nameAr || (z.nameAr ? z.nameAr.split('(')[0].trim() : z.nameAr),
          nameEn: ref?.nameEn || (z.nameEn ? z.nameEn.split('(')[0].trim() : z.nameEn),
          fee: z.fee || 2000,
          cost: mem?.cost || 2000,
          estimatedDeliveryTime: z.estimatedDeliveryTime || 'خلال 2 - 3 أيام عمل',
          isEnabled: z.isEnabled
        };
      });
    }
  } catch {}

  return memoryShippingZones;
}

export async function updateShippingZone(
  id: string,
  data: { fee: number; cost?: number; isEnabled: boolean },
  companyId?: string
) {
  await requirePermission('manage:settings');
  
  const targetCompanyId = companyId || await resolveDefaultCompanyId();
  const ratesMap = (globalThis as any).__ghazal_company_shipping_rates || {};

  if (!ratesMap[targetCompanyId]) {
    ratesMap[targetCompanyId] = BASE_JORDAN_GOVERNORATES.map(z => ({ ...z }));
  }

  const zones = ratesMap[targetCompanyId];
  const idx = zones.findIndex((z: ShippingZoneItem) => z.id === id);
  if (idx > -1) {
    zones[idx] = {
      ...zones[idx],
      fee: data.fee,
      cost: data.cost !== undefined ? data.cost : zones[idx].cost,
      isEnabled: data.isEnabled
    };
  }

  const defaultId = await resolveDefaultCompanyId();
  if (targetCompanyId === defaultId) {
    const memIdx = memoryShippingZones.findIndex(z => z.id === id);
    if (memIdx > -1) {
      memoryShippingZones[memIdx] = {
        ...memoryShippingZones[memIdx],
        fee: data.fee,
        cost: data.cost !== undefined ? data.cost : memoryShippingZones[memIdx].cost,
        isEnabled: data.isEnabled
      };
    }

    try {
      await prisma.shippingZone.update({
        where: { id },
        data: {
          fee: data.fee,
          isEnabled: data.isEnabled
        }
      });
    } catch (err) {
      console.warn('Prisma updateShippingZone fallback applied in memory');
    }
  }
  
  revalidatePath('/admin/settings/shipping');
  revalidatePath('/admin/deliveries');
  revalidatePath('/[locale]/checkout', 'page');
  return { success: true };
}
