# GHAZAL — Cosmetics & More
نظام إدارة المبيعات ونقاط البيع السحابية ومتجر إلكتروني متكامل لمستحضرات التجميل والعناية

---

## 🌟 مميزات النظام (Key Features)

- **نظام نقاط البيع السريع (POS - Point of Sale):**
  - دعم قراءة الباركود عبر أجهزة الـ USB الموصولة مباشرة بالجهاز.
  - طباعة الإيصالات الحرارية والفواتير (ESC/POS & Thermal Slip 80mm).
  - دعم وضع عدم الاتصال (Offline-Ready) وحفظ العمليات محلياً ومزامنتها تلقائياً.
  - إيقاف/استئناف الطلبات وحساب الضرائب والخصومات بدقة.

- **المتجر الإلكتروني (Online Storefront):**
  - واجهة حديثة وسريعة متوافقة مع جميع الأجهزة والهواتف الذكية.
  - سلة تسوق وإتمام طلبات مباشر وسلس.
  - ربط مباشر بواتساب للطلب السريع والتواصل مع خدمة العملاء.

- **لوحة تحكم الإدارة (Admin Dashboard):**
  - إدارة المنتجات، التصنيفات، الماركات، والمخزون والتنبيه عند انخفاض الكميات.
  - معالجة وتجهيز الطلبات مع عرض صور المنتجات وتفاصيلها.
  - تحويل الطلبات الجاهزة تلقائياً إلى طلبيات وشحنات شركات التوصيل.
  - تسوية حسابات شركات التوصيل وإدارة الدفعات على مستوى الطلبية بالكامل مع احتساب أجور التوصيل وصافي التحصيل.
  - سجل المصروفات التشغيلية للمحل (إيجار، كهرباء، مياه وإنترنت) مع خصمها التلقائي من صافي الأرباح في تقرير الأرباح والخسائر (P&L).
  - فلاتر مالية متقدمة حسب الفترة والقناة (الكاش / الأونلاين).

---

## 🛠 التقنيات المستخدمة (Tech Stack)

- **Framework:** Next.js 15 (App Router, Server Components & Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons + Framer Motion
- **Database & Backend:** Supabase PostgreSQL + Prisma ORM 7 (`@prisma/client` + `@prisma/adapter-pg`)
- **Desktop Wrapper:** Electron (لمحطات الكاشير والطباعة المباشرة)

---

## 🚀 البدء والتشغيل (Getting Started)

### 1. تثبيت الحزم (Install Dependencies)
```bash
pnpm install
```

### 2. إعداد متغيرات البيئة (Environment Variables)
قم بإنشاء ملف `.env.local` مستنداً إلى `.env.example`:
```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="[YOUR-ANON-KEY]"
SUPABASE_SECRET_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### 3. مزامنة قاعدة البيانات (Prisma DB Push & Seed)
```bash
pnpm prisma db push
pnpm seed:ghazal
```

### 4. تشغيل السيرفر المحلي (Development Server)
```bash
pnpm dev
```
افتح المتصفح على [http://localhost:3000](http://localhost:3000) للوصول إلى المتجر ولوحة الإدارة.
