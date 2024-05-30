export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { transactions, transactionsType, userSettings } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { OverviewQuerySchema } from '@/schemas';
import { and, eq, gte, lte } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const { searchParams } = new URL(req.url);
	const from = searchParams.get('from');
	const to = searchParams.get('to');

	const queryParams = OverviewQuerySchema.safeParse({
		from,
		to,
	});

	if (!queryParams.success) {
		return Response.json(queryParams.error.message, {
			status: 400,
		});
	}

	const transactions = await getTransactionsHistory(req.auth.user.id, queryParams.data.from, queryParams.data.to);

	return Response.json(transactions);
});

export type GetTransactionHistoryResponseType = Awaited<ReturnType<typeof getTransactionsHistory>>;

async function getTransactionsHistory(userId: string, from: Date, to: Date) {
	const [userSetting] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

	if (!userSetting) {
		throw new Error('user settings not found');
	}

	const formatter = GetFormatterForCurrency(userSetting.currency || 'BRL');
	const transactionsResult = await db
		.select()
		.from(transactions)
		.where(and(eq(transactions.userId, userId), lte(transactions.date, to), gte(transactions.date, from)));

	return transactionsResult.map((transaction: transactionsType) => ({
		...transaction,
		// lets format the amount with the user currency
		formattedAmount: formatter.format(transaction.amount),
	}));
}
