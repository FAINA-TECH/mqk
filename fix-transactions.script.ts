import { DataSource } from 'typeorm';
import { SaleTransaction } from './src/sale-transaction/entities/sale-transaction.entity';
import { Burner } from './src/kitchen/entities/burner.entity';
import { Stove } from './src/kitchen/entities/stove.entity';
import { Kitchen } from './src/kitchen/entities/kitchen.entity';
import { User } from './src/user/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [SaleTransaction, Burner, Stove, Kitchen, User], // ← all related entities must be here
  synchronize: false,
});

async function fixBadTransactions() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const repo = AppDataSource.getRepository(SaleTransaction);

  // 1. Preview what will be affected
  const badTransactions = await repo
    .createQueryBuilder('transaction')
    .where('CAST(transaction.amount AS DECIMAL) = :amount', { amount: 3020 })
    .andWhere('CAST(transaction.durationMinutes AS DECIMAL) = :duration', {
      duration: 90,
    })
    .getMany();

  if (badTransactions.length === 0) {
    console.log(
      '⚠️  No transactions found matching amount=3020 and duration=90mins',
    );
    await AppDataSource.destroy();
    return;
  }

  console.log(`\n📋 Found ${badTransactions.length} transaction(s) to fix:\n`);
  badTransactions.forEach((t) => {
    console.log(
      `  - ID: ${t.transactionId} | Phone: ${t.phone} | Amount: ${t.amount} | Duration: ${t.durationMinutes} | Date: ${t.createdAt}`,
    );
  });

  // 2. Apply the fix
  const result = await repo
    .createQueryBuilder()
    .update(SaleTransaction)
    .set({ amount: 50 })
    .where('CAST(amount AS DECIMAL) = :amount', { amount: 3020 })
    .andWhere('CAST(durationMinutes AS DECIMAL) = :duration', { duration: 90 })
    .execute();

  console.log(
    `\n✅ Fixed ${result.affected} transaction(s) — amount updated from 3020 → 50`,
  );

  // 3. Verify the fix
  const fixed = await repo
    .createQueryBuilder('transaction')
    .where('transaction.transactionId IN (:...ids)', {
      ids: badTransactions.map((t) => t.transactionId),
    })
    .getMany();

  console.log('\n🔍 Verification — updated records:\n');
  fixed.forEach((t) => {
    console.log(
      `  - ID: ${t.transactionId} | Phone: ${t.phone} | Amount: ${t.amount} | Duration: ${t.durationMinutes} | Date: ${t.createdAt}`,
    );
  });

  await AppDataSource.destroy();
  console.log('\n🔌 Database connection closed');
}

fixBadTransactions().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
