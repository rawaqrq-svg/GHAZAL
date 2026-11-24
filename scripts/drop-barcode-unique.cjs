const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to DB');
  
  // Drop unique constraint/index on barcode if exists
  await client.query('DROP INDEX IF EXISTS "ProductVariant_barcode_key" CASCADE;');
  console.log('Dropped unique index ProductVariant_barcode_key');
  
  // Ensure non-unique index exists for performance
  await client.query('CREATE INDEX IF NOT EXISTS "ProductVariant_barcode_idx" ON "ProductVariant"(barcode);');
  console.log('Ensured ProductVariant_barcode_idx exists');
  
  await client.end();
}

run().catch(console.error);
