export const revalidate = 0;

import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { transactions } from '@/db/schema/finance';
import { CreateOrUpdateInvoices } from '@/app/(root)/_actions/transactions';

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayTimestamp = today.getTime();

export async function GET() {
    const unpaidTodayTransactions = await db.query.transactions.findMany({
        where: (transactions, { eq, and }) =>
            and(
                eq(transactions.isPaid, false),
                sql`${transactions.date} >= ${todayTimestamp} AND ${transactions.date} < ${todayTimestamp + 86400000}`
            ),
    });

    for (const transaction of unpaidTodayTransactions) {
        await db.transaction(async (trx) => {
            await db.update(transactions).set({ isPaid: true }).where(eq(transactions.id, transaction.id));
            await CreateOrUpdateInvoices(trx, {...transaction, isPaid: true, recurrenceId: null});
        });
    }

    return new Response(JSON.stringify({ success: true, unpaidTodayTransactions }));
}
