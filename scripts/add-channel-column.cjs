const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL...');
  await pool.query(`
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "channel" VARCHAR(20) DEFAULT 'SHARED';
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "Product_channel_idx" ON "Product"("channel");
  `);
  console.log('Successfully added channel column and index to Product in Supabase!');

  // Verify
  const res = await pool.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'channel';
  `);
  console.log('Verified column in Supabase:', res.rows);
  await pool.end();
}

run().catch(err => {
  console.error('Migration error:', err);
  pool.end();
  process.exit(1);
});
