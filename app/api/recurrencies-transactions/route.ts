export const revalidate = 0;

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { teamMembers, userSettings } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const userId = req.auth.user.id;

	const transactionsResult = await getRecurrenciesTransactions(userId);

	return Response.json(transactionsResult);
});

export type GetRecurrentTransactionHistoryResponseType = Awaited<ReturnType<typeof getRecurrenciesTransactions>>;

async function getRecurrenciesTransactions(userId: string) {
	const [userSetting] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

	if (!userSetting) {
		throw new Error('user settings not found');
	}

	const formatter = GetFormatterForCurrency(userSetting.currency || 'BRL');

	const teams = (
		await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId))
	).map((obj) => obj.teamId);

	const transactionsResult = await db.query.recurringTransactions.findMany({
		with: {
			team: {
				columns: {
					name: true,
				},
			},
			bankingAccount: {
				columns: {
					name: true,
				},
			},
			user: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
		where: (transactions, { eq, or }) =>
			or(inArray(transactions.teamId, teams.concat('any')), eq(transactions.userId, userId)),
	});

	return transactionsResult.map((transaction) => ({
		...transaction,
		formattedAmount: formatter.format(transaction.amount),
	}));
}
