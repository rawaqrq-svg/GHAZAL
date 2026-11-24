'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/dal';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import crypto from 'crypto';

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
  await requirePermission('manage:settings');
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
  const headersList = await headers();
  const clientIp = getClientIp(headersList);

  const allowed = await checkRateLimit(clientIp, 'pos_device_pairing', 5, 15);
  if (!allowed) {
    return { success: false, error: 'تم تجاوز عدد محاولات التفعيل المسموح بها. يرجى المحاولة لاحقاً.' };
  }

  if (!code || typeof code !== 'string') {
    return { success: false, error: 'رمز التفعيل غير صالح' };
  }

  const cleanInput = code.toUpperCase().trim();
  const activeCode = currentPairingCode.code.toUpperCase().trim();

  // Expiration check
  if (Date.now() > currentPairingCode.expiresAt) {
    return { success: false, error: 'رمز التفعيل منتهي الصلاحية' };
  }

  // Constant-time comparison
  let isMatch = false;
  try {
    const a = Buffer.from(cleanInput);
    const b = Buffer.from(activeCode);
    isMatch = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    return { success: false, error: 'رمز التفعيل غير صحيح أو منتهي الصلاحية' };
  }

  // Invalidate code after successful pairing to prevent replay
  currentPairingCode.expiresAt = 0;

  cachedDevice.isAuthorized = true;
  cachedDevice.status = 'ONLINE';
  cachedDevice.deviceName = deviceName.trim().substring(0, 50);
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
        deviceName: cachedDevice.deviceName,
        lastSeenAt: new Date(),
      },
      create: {
        deviceName: cachedDevice.deviceName,
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
  await requirePermission('manage:settings');
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
