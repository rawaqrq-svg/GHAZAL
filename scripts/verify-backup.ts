import { Client } from 'pg';

/**
 * GHAZAL - Automated Backup Verification Engine
 *
 * Performs deep mathematical, structural, and relational integrity validation
 * of a restored PostgreSQL backup (on Neon) against the primary database (on Supabase).
 *
 * Verifications Performed:
 * 1. Presence of all 45 core Prisma models.
 * 2. Exact row count parity across all 45 tables.
 * 3. Exact Jordanian fils parity (0 variance) for:
 *    - Sale.total
 *    - Invoice.grossTotalFils
 *    - Order.totalAmount
 *    - Payment.amount
 *    - CashMovement.amountFils
 * 4. Foreign Key and relational referential integrity.
 */

export const ALL_PRISMA_TABLES = [
  'Accord',
  'AuditLog',
  'Brand',
  'CashMovement',
  'Category',
  'Employee',
  'EmployeePermission',
  'FragranceFamily',
  'Gender',
  'GlobalPricingSettings',
  'HeldSale',
  'HomepageHeroCarouselSettings',
  'HomepageHeroSlide',
  'ImportJob',
  'ImportJobRow',
  'InventoryMovement',
  'Invoice',
  'LoginAttempt',
  'Order',
  'OrderItem',
  'OrderStatusHistory',
  'POSDevice',
  'Payment',
  'PendingMfaChallenge',
  'Permission',
  'Product',
  'ProductAccord',
  'ProductImage',
  'ProductNote',
  'ProductSimilar',
  'ProductVariant',
  'RateLimitEvent',
  'Return',
  'ReturnItem',
  'Role',
  'RolePermission',
  'Sale',
  'SaleItem',
  'Season',
  'Session',
  'Shift',
  'ShippingZone',
  'SiteSettings',
  'StockAdjustment',
  'StoreLocationSettings',
] as const;

export interface TableRowParity {
  table: string;
  sourceRows: number;
  targetRows: number;
  match: boolean;
}

export interface FinancialMetricParity {
  name: string;
  table: string;
  field: string;
  sourceFils: number;
  targetFils: number;
  varianceFils: number;
  match: boolean;
}

export interface RelationalIntegrityCheck {
  name: string;
  description: string;
  orphanCount: number;
  passed: boolean;
}

export interface VerificationResult {
  passed: boolean;
  timestamp: string;
  sourceDb: string;
  targetDb: string;
  targetSchema: string;
  tablesTotal: number;
  tablesVerified: number;
  sourceTotalRows: number;
  targetTotalRows: number;
  tableParity: TableRowParity[];
  financialParity: FinancialMetricParity[];
  relationalChecks: RelationalIntegrityCheck[];
  errors: string[];
}

export interface VerifyBackupOptions {
  sourceConnectionString?: string;
  targetConnectionString?: string;
  sourceSchema?: string;
  targetSchema?: string;
  silent?: boolean;
}

/**
 * Executes full automated verification between source (Supabase) and target (Neon).
 */
export async function verifyBackup(options: VerifyBackupOptions = {}): Promise<VerificationResult> {
  const sourceUrl =
    options.sourceConnectionString ||
    process.env.SUPABASE_BACKUP_URL ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL;

  const targetUrl =
    options.targetConnectionString ||
    process.env.NEON_BACKUP_URL;

  if (!sourceUrl) {
    throw new Error('Verification failed: Source connection URL (Supabase) is missing.');
  }

  if (!targetUrl) {
    throw new Error('Verification failed: Target connection URL (Neon) is missing.');
  }

  const sourceSchema = options.sourceSchema || 'public';
  const targetSchema =
    options.targetSchema ||
    process.env.TARGET_SCHEMA ||
    'ghazal_backup_current';
  const log = options.silent ? () => {} : console.log;

  log(`[Verify-Backup] Initializing deep validation:`);
  log(`  Source Schema: ${sourceSchema}`);
  log(`  Target Schema: ${targetSchema}`);

  const sourceClient = new Client({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const targetClient = new Client({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const errors: string[] = [];
  const tableParity: TableRowParity[] = [];
  const financialParity: FinancialMetricParity[] = [];
  const relationalChecks: RelationalIntegrityCheck[] = [];

  let sourceTotalRows = 0;
  let targetTotalRows = 0;
  let tablesVerified = 0;

  try {
    await sourceClient.connect();
    await targetClient.connect();

    // 1. Check Table Presence in Target
    log(`[Verify-Backup] Checking presence of all 45 Prisma schema tables...`);
    const targetTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1;
    `;
    const targetTablesRes = await targetClient.query(targetTablesQuery, [targetSchema]);
    const existingTargetTables = new Set(targetTablesRes.rows.map((r: any) => r.table_name));

    for (const table of ALL_PRISMA_TABLES) {
      if (!existingTargetTables.has(table)) {
        errors.push(`Table missing in target backup: "${targetSchema}"."${table}"`);
      }
    }

    // 2. Row Counts Parity Across All 45 Tables
    log(`[Verify-Backup] Verifying exact row count parity across tables...`);
    for (const table of ALL_PRISMA_TABLES) {
      try {
        const srcQuery = `SELECT count(*)::bigint as count FROM "${sourceSchema}"."${table}";`;
        const tgtQuery = `SELECT count(*)::bigint as count FROM "${targetSchema}"."${table}";`;

        const srcRes = await sourceClient.query(srcQuery);
        const tgtRes = await targetClient.query(tgtQuery);

        const srcCount = parseInt(srcRes.rows[0]?.count || '0', 10);
        const tgtCount = parseInt(tgtRes.rows[0]?.count || '0', 10);

        sourceTotalRows += srcCount;
        targetTotalRows += tgtCount;

        const match = srcCount === tgtCount;
        tableParity.push({
          table,
          sourceRows: srcCount,
          targetRows: tgtCount,
          match,
        });

        if (match) {
          tablesVerified++;
        } else {
          errors.push(`Row count mismatch in "${table}": Source has ${srcCount}, Target has ${tgtCount}`);
        }
      } catch (err: any) {
        errors.push(`Failed to count rows for "${table}": ${err.message}`);
      }
    }

    // 3. Financial Invariant Validations (Jordanian Fils)
    log(`[Verify-Backup] Validating financial invariants (Jordanian fils)...`);
    const financialChecks = [
      { name: 'إجمالي المبيعات (Sale.total)', table: 'Sale', field: 'total' },
      { name: 'إجمالي الفواتير (Invoice.grossTotalFils)', table: 'Invoice', field: 'grossTotalFils' },
      { name: 'إجمالي الطلبات (Order.totalAmount)', table: 'Order', field: 'totalAmount' },
      { name: 'إجمالي المدفوعات (Payment.amount)', table: 'Payment', field: 'amount' },
      { name: 'حركات الصندوق (CashMovement.amountFils)', table: 'CashMovement', field: 'amountFils' },
    ];

    for (const chk of financialChecks) {
      try {
        const srcQuery = `SELECT COALESCE(SUM("${chk.field}"), 0)::bigint AS sum FROM "${sourceSchema}"."${chk.table}";`;
        const tgtQuery = `SELECT COALESCE(SUM("${chk.field}"), 0)::bigint AS sum FROM "${targetSchema}"."${chk.table}";`;

        const srcRes = await sourceClient.query(srcQuery);
        const tgtRes = await targetClient.query(tgtQuery);

        const srcFils = parseInt(srcRes.rows[0]?.sum || '0', 10);
        const tgtFils = parseInt(tgtRes.rows[0]?.sum || '0', 10);
        const varianceFils = Math.abs(srcFils - tgtFils);
        const match = varianceFils === 0;

        financialParity.push({
          name: chk.name,
          table: chk.table,
          field: chk.field,
          sourceFils: srcFils,
          targetFils: tgtFils,
          varianceFils,
          match,
        });

        if (!match) {
          errors.push(
            `Financial invariant failed for ${chk.name}: Source=${srcFils} fils, Target=${tgtFils} fils (Variance=${varianceFils} fils)`
          );
        }
      } catch (err: any) {
        errors.push(`Financial check error for ${chk.name}: ${err.message}`);
      }
    }

    // 4. Relational & Foreign Key Integrity
    log(`[Verify-Backup] Validating relational foreign key integrity...`);
    const relationalQueries = [
      {
        name: 'SaleItem -> Sale',
        description: 'Orphan SaleItems without valid parent Sale',
        query: `
          SELECT count(*)::bigint as orphans 
          FROM "${targetSchema}"."SaleItem" si
          WHERE NOT EXISTS (
            SELECT 1 FROM "${targetSchema}"."Sale" s WHERE s.id = si."saleId"
          );
        `,
      },
      {
        name: 'OrderItem -> Order',
        description: 'Orphan OrderItems without valid parent Order',
        query: `
          SELECT count(*)::bigint as orphans 
          FROM "${targetSchema}"."OrderItem" oi
          WHERE NOT EXISTS (
            SELECT 1 FROM "${targetSchema}"."Order" o WHERE o.id = oi."orderId"
          );
        `,
      },
      {
        name: 'ProductVariant -> Product',
        description: 'Orphan ProductVariants without valid parent Product',
        query: `
          SELECT count(*)::bigint as orphans 
          FROM "${targetSchema}"."ProductVariant" pv
          WHERE NOT EXISTS (
            SELECT 1 FROM "${targetSchema}"."Product" p WHERE p.id = pv."productId"
          );
        `,
      },
      {
        name: 'Payment -> Sale',
        description: 'Orphan Payments linked to non-existent Sale',
        query: `
          SELECT count(*)::bigint as orphans 
          FROM "${targetSchema}"."Payment" p
          WHERE p."saleId" IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM "${targetSchema}"."Sale" s WHERE s.id = p."saleId"
          );
        `,
      },
    ];

    for (const rel of relationalQueries) {
      try {
        const res = await targetClient.query(rel.query);
        const orphanCount = parseInt(res.rows[0]?.orphans || '0', 10);
        const passed = orphanCount === 0;

        relationalChecks.push({
          name: rel.name,
          description: rel.description,
          orphanCount,
          passed,
        });

        if (!passed) {
          errors.push(`Relational integrity failure in ${rel.name}: ${orphanCount} orphan records detected.`);
        }
      } catch (err: any) {
        errors.push(`Relational query failed for ${rel.name}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Fatal verification error: ${err.message}`);
  } finally {
    await sourceClient.end().catch(() => {});
    await targetClient.end().catch(() => {});
  }

  const passed = errors.length === 0 && tablesVerified === ALL_PRISMA_TABLES.length;

  log(`[Verify-Backup] Verification finished: Passed = ${passed}`);
  if (!passed) {
    log(`[Verify-Backup] Errors found:`, errors);
  }

  return {
    passed,
    timestamp: new Date().toISOString(),
    sourceDb: 'Supabase PostgreSQL',
    targetDb: 'Neon PostgreSQL',
    targetSchema,
    tablesTotal: ALL_PRISMA_TABLES.length,
    tablesVerified,
    sourceTotalRows,
    targetTotalRows,
    tableParity,
    financialParity,
    relationalChecks,
    errors,
  };
}

// Standalone CLI execution
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.endsWith('verify-backup.ts'))) {
  verifyBackup()
    .then((result) => {
      console.log('\n--- VERIFICATION SUMMARY ---');
      console.log(`Status: ${result.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
      console.log(`Tables Verified: ${result.tablesVerified} / ${result.tablesTotal}`);
      console.log(`Total Rows: Source=${result.sourceTotalRows}, Target=${result.targetTotalRows}`);
      console.log(`Financial Invariants Checked: ${result.financialParity.length}`);
      result.financialParity.forEach((f) => {
        console.log(`  - ${f.name}: Source=${f.sourceFils} fils, Target=${f.targetFils} fils (Match: ${f.match})`);
      });
      console.log(`Relational Checks: ${result.relationalChecks.length}`);
      result.relationalChecks.forEach((r) => {
        console.log(`  - ${r.name}: Orphans=${r.orphanCount} (Passed: ${r.passed})`);
      });

      if (!result.passed) {
        console.error('\nErrors:');
        result.errors.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
