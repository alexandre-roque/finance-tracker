export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts, creditCardInvoices } from '@/db/schema/finance';
import { and, eq, lt, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const stats = await getTotalBalanceStats(req.auth.user.id);

	return Response.json(stats);
});

export type GetTotalBalanceStatsResponseType = Awaited<ReturnType<typeof getTotalBalanceStats>>;

async function getTotalBalanceStats(userId: string) {
	const date = new Date();

	const [balance] = await db
		.select({ value: sum(bankingAccounts.balance) })
		.from(bankingAccounts)
		.where(eq(bankingAccounts.userId, userId));

	const [credit] = await db
		.select({ value: sum(creditCardInvoices.amount) })
		.from(creditCardInvoices)
		.where(and(eq(creditCardInvoices.userId, userId), eq(creditCardInvoices.isPaid, false)));

	return {
		balance,
		credit,
	};
}
