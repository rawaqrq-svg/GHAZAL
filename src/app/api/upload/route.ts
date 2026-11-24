import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/dal';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على أي ملف' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg',
      '.mp4', '.webm', '.ogg', '.mov', '.m4v'
    ];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ success: false, error: 'صيغة الملف غير مدعومة' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext);

    let finalBuffer = rawBuffer;
    let finalExt = ext;

    // Convert raster images to WebP
    if (isImage && ext !== '.svg' && ext !== '.gif') {
      try {
        finalBuffer = await sharp(rawBuffer)
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
        finalExt = '.webp';
      } catch (sharpError) {
        console.warn('Sharp WebP conversion skipped, using original:', sharpError);
      }
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${finalExt}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(localFilePath, finalBuffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`
    });
  } catch (error: any) {
    console.error('API Upload Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ أثناء رفع الملف'
    }, { status: 500 });
  }
}
