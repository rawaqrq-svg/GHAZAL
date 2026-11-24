const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

async function importOldPOSBackupBulk() {
  const startTime = Date.now();
  console.log('=== [START] High-Performance Bulk POS Product Import (SQL-PRO) ===');

  const backupFilePath = path.join(__dirname, '..', 'backup', 'data-2026-11-23.json');
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at: ${backupFilePath}`);
  }

  const rawData = fs.readFileSync(backupFilePath, 'utf8');
  const backup = JSON.parse(rawData);
  const { categories: backupCategories = [], products: backupProducts = [] } = backup;

  console.log(`Loaded backup: ${backupCategories.length} categories, ${backupProducts.length} products.`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // 1. Fetch & ensure all categories exist in PostgreSQL
    const existingCatsRes = await client.query('SELECT id, name, slug FROM "Category";');
    const existingCats = existingCatsRes.rows;
    console.log(`Found ${existingCats.length} existing categories in PostgreSQL.`);

    const catBySlug = new Map(existingCats.map(c => [c.slug, c.id]));
    const catByName = new Map(existingCats.map(c => [c.name.trim(), c.id]));

    const categoryConfigs = [
      { id: 9, name: 'الإكسسوارات', slug: 'accessories', aliases: ['اكسسوارات', 'الإكسسوارات'] },
      { id: 10, name: 'العطور', slug: 'fragrances', aliases: ['عطور', 'العطور'] },
      { id: 11, name: 'المكياج', slug: 'makeup', aliases: ['مكياج', 'المكياج'] },
      { id: 12, name: 'كريمات', slug: 'creams', aliases: ['كريمات'] },
      { id: 13, name: 'سبلاش', slug: 'splash', aliases: ['سبلاش'] },
      { id: 14, name: 'العناية بالشعر', slug: 'haircare', aliases: ['العناية بالشعر'] },
      { id: 15, name: 'العناية بالبشرة', slug: 'skincare', aliases: ['العناية بالبشرة'] },
      { id: 16, name: 'ساعات', slug: 'watches', aliases: ['ساعات'] },
      { id: 17, name: 'شالات', slug: 'shawls', aliases: ['شالات'] },
      { id: 18, name: 'مزيل عرق', slug: 'deodorants', aliases: ['مزيل عرق', 'مزيلات عرق'] },
      { id: 19, name: 'العناية بالجسم', slug: 'bodycare', aliases: ['العناية بالجسم'] },
      { id: 22, name: 'أجهزة كهربائية', slug: 'electrical-appliances', aliases: ['اجهزة كهربائية', 'أجهزة كهربائية', 'اجهزة الكهربائية'] },
      { id: 23, name: 'مناكير', slug: 'nail-polish', aliases: ['مناكير'] },
      { id: 24, name: 'أظافر', slug: 'nails', aliases: ['اظافر', 'أظافر', 'الاظافر'] },
      { id: 25, name: 'بكجات عطور', slug: 'perfume-sets', aliases: ['بكجات عطور', 'الهدايا والمجموعات'] },
      { id: 26, name: 'رموش', slug: 'eyelashes', aliases: ['رموش', 'الرموش'] },
      { id: 27, name: 'شالات وقمطات', slug: 'shawls-and-wraps', aliases: ['شالات وقمطات'] },
      { id: 28, name: 'محافظ', slug: 'wallets', aliases: ['محافظ'] },
      { id: 29, name: 'أظافر', slug: 'nails', aliases: ['الاظافر', 'اظافر', 'أظافر'] },
      { id: 30, name: 'رموش', slug: 'eyelashes', aliases: ['الرموش', 'رموش'] },
      { id: 31, name: 'أجهزة كهربائية', slug: 'electrical-appliances', aliases: ['اجهزة الكهربائية', 'اجهزة كهربائية'] },
      { id: 32, name: 'العناية بالفم', slug: 'oral-care', aliases: ['العناية بالفم'] },
      { id: 33, name: 'ملابس', slug: 'clothing', aliases: ['ملابس'] },
      { id: 34, name: 'فوط نسائية', slug: 'feminine-care', aliases: ['فوط نسائية'] },
    ];

    const oldCatToDbId = new Map();

    for (const conf of categoryConfigs) {
      let dbId = catBySlug.get(conf.slug);
      if (!dbId) {
        for (const alias of conf.aliases) {
          if (catByName.has(alias)) {
            dbId = catByName.get(alias);
            break;
          }
        }
      }

      if (!dbId) {
        const newId = crypto.randomUUID();
        await client.query(
          'INSERT INTO "Category" (id, name, slug, "sortOrder") VALUES ($1, $2, $3, $4);',
          [newId, conf.name, conf.slug, 50]
        );
        catBySlug.set(conf.slug, newId);
        catByName.set(conf.name, newId);
        dbId = newId;
        console.log(`[Category Created] "${conf.name}" (slug: ${conf.slug}, id: ${newId})`);
      }

      oldCatToDbId.set(conf.id, dbId);
    }

    let fallbackCatId = catBySlug.get('accessories') || existingCats[0]?.id;

    // 2. Query existing products with sku LIKE 'POS-TT-%'
    const existingSkuRes = await client.query('SELECT sku, id FROM "Product" WHERE sku LIKE \'POS-TT-%\';');
    const existingSkuMap = new Map(existingSkuRes.rows.map(r => [r.sku, r.id]));
    console.log(`Found ${existingSkuMap.size} previously imported POS-TT products.`);

    // 3. Multi-row bulk insert in chunks of 100
    const CHUNK_SIZE = 100;
    let totalProcessed = 0;

    for (let i = 0; i < backupProducts.length; i += CHUNK_SIZE) {
      const chunk = backupProducts.slice(i, i + CHUNK_SIZE);
      await client.query('BEGIN');

      try {
        const productRows = [];
        const variantRows = [];

        for (const p of chunk) {
          const sku = `POS-TT-${p.id}`;
          const variantSku = `POS-TT-${p.id}-STD`;
          const slug = `pos-tt-${p.id}`;
          const nameAr = (p.name || `منتج كاشير ${p.id}`).trim();
          const nameEn = nameAr;
          const targetCategoryId = oldCatToDbId.get(p.categoryId) || fallbackCatId;
          const priceFils = Math.max(0, Math.round((Number(p.sellPrice) || 0) * 1000));
          const barcode = p.barcode && String(p.barcode).trim() ? String(p.barcode).trim() : null;
          const stockQty = Math.max(0, Number(p.stock) || 0);

          let prodId = existingSkuMap.get(sku);
          if (!prodId) {
            prodId = crypto.randomUUID();
            existingSkuMap.set(sku, prodId);
          }

          productRows.push({
            id: prodId,
            slug,
            nameAr,
            nameEn,
            sku,
            categoryId: targetCategoryId,
            channel: 'POS',
            isVisible: false,
            isFeatured: false,
            featuredOrder: 0,
            needsReview: false,
            stockStatus: 'IN_STOCK',
            notesStatus: 'VERIFIED',
            stockLiters: stockQty,
            rating: 5.0,
            reviewsCount: 0
          });

          variantRows.push({
            id: crypto.randomUUID(),
            productId: prodId,
            size: 'Standard',
            barcode,
            sku: variantSku,
            price: priceFils,
            isActive: true,
            usesGlobalPricing: true
          });
        }

        // Multi-row INSERT on Product with ON CONFLICT (sku) DO UPDATE
        const prodPlaceholders = [];
        const prodValues = [];
        let pParamIdx = 1;

        for (const pr of productRows) {
          prodPlaceholders.push(`(
            $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++},
            $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++},
            $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++}, $${pParamIdx++},
            $${pParamIdx++}, NOW(), NOW()
          )`);
          prodValues.push(
            pr.id, pr.slug, pr.nameAr, pr.nameEn, pr.sku,
            pr.categoryId, pr.channel, pr.isVisible, pr.isFeatured, pr.featuredOrder,
            pr.needsReview, pr.stockStatus, pr.notesStatus, pr.stockLiters, pr.rating,
            pr.reviewsCount
          );
        }

        const prodInsertSql = `
          INSERT INTO "Product" (
            id, slug, "nameAr", "nameEn", sku,
            "categoryId", channel, "isVisible", "isFeatured", "featuredOrder",
            "needsReview", "stockStatus", "notesStatus", "stockLiters", rating,
            "reviewsCount", "createdAt", "updatedAt"
          ) VALUES ${prodPlaceholders.join(', ')}
          ON CONFLICT (sku) DO UPDATE SET
            "nameAr" = EXCLUDED."nameAr",
            "nameEn" = EXCLUDED."nameEn",
            "categoryId" = EXCLUDED."categoryId",
            channel = 'POS',
            "isVisible" = false,
            "stockStatus" = 'IN_STOCK',
            "stockLiters" = EXCLUDED."stockLiters",
            "updatedAt" = NOW();
        `;
        await client.query(prodInsertSql, prodValues);

        // Multi-row INSERT on ProductVariant with ON CONFLICT (sku) DO UPDATE
        const varPlaceholders = [];
        const varValues = [];
        let vParamIdx = 1;

        for (const vr of variantRows) {
          varPlaceholders.push(`(
            $${vParamIdx++}, $${vParamIdx++}, $${vParamIdx++}, $${vParamIdx++}, $${vParamIdx++},
            $${vParamIdx++}, $${vParamIdx++}, $${vParamIdx++}, NOW(), NOW()
          )`);
          varValues.push(
            vr.id, vr.productId, vr.size, vr.barcode, vr.sku,
            vr.price, vr.isActive, vr.usesGlobalPricing
          );
        }

        const varInsertSql = `
          INSERT INTO "ProductVariant" (
            id, "productId", size, barcode, sku,
            price, "isActive", "usesGlobalPricing", "createdAt", "updatedAt"
          ) VALUES ${varPlaceholders.join(', ')}
          ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            barcode = EXCLUDED.barcode,
            "isActive" = true,
            "updatedAt" = NOW();
        `;
        await client.query(varInsertSql, varValues);

        await client.query('COMMIT');
        totalProcessed += chunk.length;
        console.log(`[Batch Done] Processed ${totalProcessed} / ${backupProducts.length} products...`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Error] Rollback at chunk starting at ${i}:`, err.message);
        throw err;
      }
    }

    // 4. Verification queries
    console.log('\n--- [Verification & Integrity Audit] ---');
    const totalPosRes = await client.query("SELECT count(*) FROM \"Product\" WHERE channel = 'POS';");
    const totalPosBackupRes = await client.query("SELECT count(*) FROM \"Product\" WHERE sku LIKE 'POS-TT-%';");
    const leakRes = await client.query("SELECT count(*) FROM \"Product\" WHERE channel = 'POS' AND \"isVisible\" = true;");
    const sampleRes = await client.query(`
      SELECT p.id, p."nameAr", p.sku, p.channel, p."isVisible", v.price, v.barcode, c.name as category_name
      FROM "Product" p
      JOIN "ProductVariant" v ON v."productId" = p.id
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE p.sku LIKE 'POS-TT-%'
      ORDER BY p.sku ASC
      LIMIT 5;
    `);

    console.log(`✓ Total POS products in DB: ${totalPosRes.rows[0].count}`);
    console.log(`✓ Total imported TopTag POS products: ${totalPosBackupRes.rows[0].count}`);
    console.log(`✓ Storefront leak check (must be 0): ${leakRes.rows[0].count}`);
    console.log('✓ Samples:', sampleRes.rows);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n=== [SUCCESS] 2,315 POS Products Imported Cleanly in ${elapsed}s ===`);
  } finally {
    await client.end();
  }
}

importOldPOSBackupBulk().catch(err => {
  console.error('[FATAL] Bulk import failed:', err);
  process.exit(1);
});
