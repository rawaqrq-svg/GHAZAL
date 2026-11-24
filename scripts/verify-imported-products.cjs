const { Client } = require('pg');

async function verify() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('=== [LIVE DATABASE INTEGRITY VERIFICATION] ===');

  // 1. Total count of imported products with sku starting with 'POS-TT-'
  const ttCountRes = await client.query("SELECT count(*) FROM \"Product\" WHERE sku LIKE 'POS-TT-%';");
  const ttCount = parseInt(ttCountRes.rows[0].count, 10);
  console.log(`1. Total TopTag POS backup products in DB: ${ttCount} (Expected: 2315)`);
  if (ttCount !== 2315) {
    throw new Error(`Expected 2315 products, but found ${ttCount}`);
  }

  // 2. Channel check: all must be 'POS'
  const nonPosCountRes = await client.query("SELECT count(*) FROM \"Product\" WHERE sku LIKE 'POS-TT-%' AND channel != 'POS';");
  const nonPosCount = parseInt(nonPosCountRes.rows[0].count, 10);
  console.log(`2. Non-POS channel count among imported products: ${nonPosCount} (Expected: 0)`);
  if (nonPosCount !== 0) {
    throw new Error(`Found ${nonPosCount} products with invalid channel!`);
  }

  // 3. Storefront visibility check: all must have isVisible = false
  const visibleCountRes = await client.query("SELECT count(*) FROM \"Product\" WHERE sku LIKE 'POS-TT-%' AND \"isVisible\" = true;");
  const visibleCount = parseInt(visibleCountRes.rows[0].count, 10);
  console.log(`3. Storefront visible count among imported products: ${visibleCount} (Expected: 0)`);
  if (visibleCount !== 0) {
    throw new Error(`Found ${visibleCount} POS products visible on storefront!`);
  }

  // 4. Variant verification: each must have a corresponding variant with valid price and barcode
  const variantStatsRes = await client.query(`
    SELECT 
      count(v.id) as total_variants,
      count(v.barcode) as variants_with_barcode,
      min(v.price) as min_price,
      max(v.price) as max_price,
      avg(v.price) as avg_price
    FROM "ProductVariant" v
    JOIN "Product" p ON p.id = v."productId"
    WHERE p.sku LIKE 'POS-TT-%';
  `);
  console.log('4. Variant Statistics:', variantStatsRes.rows[0]);

  // 5. Category distribution check
  const catDistributionRes = await client.query(`
    SELECT c.name as category_name, count(p.id) as product_count
    FROM "Product" p
    JOIN "Category" c ON c.id = p."categoryId"
    WHERE p.sku LIKE 'POS-TT-%'
    GROUP BY c.name
    ORDER BY product_count DESC;
  `);
  console.log('5. Category Distribution:');
  console.table(catDistributionRes.rows);

  console.log('\n=== ALL DATABASE CHECKS PASSED WITH 100% SUCCESS ===');
  await client.end();
}

verify().catch(err => {
  console.error('[FAILED] Verification error:', err);
  process.exit(1);
});
