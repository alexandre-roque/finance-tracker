export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts, teamMembers, teams, transactions } from '@/db/schema/finance';
import { OverviewQuerySchema } from '@/schemas';
import { and, eq, gte, inArray, lte, or, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const { searchParams } = new URL(req.url);
	const from = searchParams.get('from');
	const to = searchParams.get('to');

	const queryParams = OverviewQuerySchema.safeParse({ from, to });

	if (!queryParams.success) {
		return Response.json(queryParams.error.message, {
			status: 400,
		});
	}

	const userId = req.auth.user.id;
	const fromDate = new Date(queryParams.data.from);
	const toDate = new Date(queryParams.data.to);

	const accountBalance = await getTeamsBalance(userId, fromDate, toDate);

	return Response.json(accountBalance);
});

export type GetTeamsBalanceResponseType = Awaited<ReturnType<typeof getTeamsBalance>>;

async function getTeamsBalance(userId: string, from: Date, to: Date) {
	const teamsResult = (
		await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId))
	).map((obj) => obj.teamId);

	const totals = await db
		.select({
			value: sum(transactions.amount),
			type: transactions.type,
			teamName: teams.name,
			teamId: transactions.teamId,
		})
		.from(transactions)
		.where(
			and(
				or(inArray(transactions.teamId, teamsResult.concat('any')), eq(transactions.userId, userId)),
				lte(transactions.date, to),
				gte(transactions.date, from)
			)
		)
		.leftJoin(teams, eq(transactions.teamId, teams.id))
		.groupBy(transactions.type, teams.name);

	return totals;
}