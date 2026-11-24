import { NextResponse } from 'next/server';
import { getShippingZonesList } from '@/actions/shipping';

export async function GET() {
  try {
    const allZones = await getShippingZonesList();
    const activeZones = allZones.filter(z => z.isEnabled !== false);
    return NextResponse.json({
      success: true,
      zones: activeZones.length > 0 ? activeZones : allZones
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
