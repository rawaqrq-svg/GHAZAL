'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface DeviceInfo {
  id: string;
  deviceName: string;
  machineKey: string;
  terminalId: string;
  branchName: string;
  isAuthorized: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'PENDING';
  lastSeenAt: string;
  createdAt: string;
}

// Fallback in-memory state for resilient operations
let cachedDevice: DeviceInfo = {
  id: 'dev-ghazal-01',
  deviceName: 'GHAZAL-POS-01',
  machineKey: 'GHAZAL-MAC-AIN-ALBASHA-2026',
  terminalId: 'POS-TERM-01',
  branchName: 'الفرع الرئيسي — عين الباشا',
  isAuthorized: true,
  status: 'ONLINE',
  lastSeenAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

let currentPairingCode: { code: string; expiresAt: number } = {
  code: 'ABCD-4821',
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
};

export async function getPOSDeviceStatus(): Promise<{ device: DeviceInfo; pairingCode: string }> {
  try {
    const dbDevice = await prisma.pOSDevice.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (dbDevice) {
      const isOnline = Date.now() - new Date(dbDevice.lastSeenAt).getTime() < 3 * 60 * 1000;
      cachedDevice = {
        id: dbDevice.id,
        deviceName: dbDevice.deviceName || 'GHAZAL-POS-01',
        machineKey: dbDevice.machineKey,
        terminalId: dbDevice.terminalId || 'POS-TERM-01',
        branchName: 'الفرع الرئيسي — عين الباشا',
        isAuthorized: dbDevice.isAuthorized,
        status: dbDevice.isAuthorized ? (isOnline ? 'ONLINE' : 'OFFLINE') : 'PENDING',
        lastSeenAt: dbDevice.lastSeenAt.toISOString(),
        createdAt: dbDevice.createdAt.toISOString(),
      };
    }
  } catch (err) {
    console.warn('DB POSDevice query skipped, using cached device profile');
  }

  return {
    device: cachedDevice,
    pairingCode: currentPairingCode.code,
  };
}

export async function generateNewPairingCode(): Promise<{ success: boolean; code: string }> {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let prefix = '';
  for (let i = 0; i < 4; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  const newCode = `${prefix}-${suffix}`;
  currentPairingCode = {
    code: newCode,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
  };

  revalidatePath('/admin/pos/device');
  return { success: true, code: newCode };
}

export async function authorizeDeviceByCode(code: string, deviceName = 'GHAZAL-POS-01') {
  if (code.toUpperCase().trim() !== currentPairingCode.code) {
    return { success: false, error: 'رمز التفعيل غير صحيح أو منتهي الصلاحية' };
  }

  cachedDevice.isAuthorized = true;
  cachedDevice.status = 'ONLINE';
  cachedDevice.deviceName = deviceName;
  cachedDevice.lastSeenAt = new Date().toISOString();

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('ghazal_pos_paired_device', cachedDevice.machineKey, {
      maxAge: 10 * 365 * 24 * 60 * 60, // 10 years permanent pairing
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  } catch {}

  try {
    await prisma.pOSDevice.upsert({
      where: { machineKey: cachedDevice.machineKey },
      update: {
        isAuthorized: true,
        deviceName,
        lastSeenAt: new Date(),
      },
      create: {
        deviceName,
        machineKey: cachedDevice.machineKey,
        terminalId: cachedDevice.terminalId,
        isAuthorized: true,
      },
    });
  } catch (err) {
    console.warn('DB upsert POSDevice fallback');
  }

  revalidatePath('/admin/pos/device');
  return { success: true, device: cachedDevice };
}

export async function toggleDeviceAuthorization(deviceId: string, authorize: boolean) {
  cachedDevice.isAuthorized = authorize;
  cachedDevice.status = authorize ? 'ONLINE' : 'OFFLINE';

  try {
    await prisma.pOSDevice.update({
      where: { id: deviceId },
      data: { isAuthorized: authorize },
    });
  } catch (err) {
    console.warn('DB update POSDevice fallback');
  }

  revalidatePath('/admin/pos/device');
  return { success: true };
}

export async function recordDeviceHeartbeat(machineKey: string) {
  cachedDevice.lastSeenAt = new Date().toISOString();
  cachedDevice.status = 'ONLINE';

  try {
    await prisma.pOSDevice.updateMany({
      where: { machineKey },
      data: { lastSeenAt: new Date() },
    });
  } catch {}

  return { success: true };
}
