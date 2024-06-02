export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { teamMembers, teams, transactions } from '@/db/schema/finance';
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

	const stats = await getCategoriesStats(req.auth.user.id, queryParams.data.from, queryParams.data.to);

	return Response.json(stats);
});

export type GetCategoriesStatsResponseType = Awaited<ReturnType<typeof getCategoriesStats>>;

async function getCategoriesStats(userId: string, from: Date, to: Date) {
	const t = await db
		.select({
			teamId: teams.id,
			teamName: teams.name,
		})
		.from(teamMembers)
		.rightJoin(teams, eq(teamMembers.teamId, teams.id))
		.where(eq(teamMembers.userId, userId));

	const totals = await db
		.select({
			value: sum(transactions.amount),
			type: transactions.type,
			category: transactions.category,
			categoryIcon: transactions.categoryIcon,
			teamId: transactions.teamId,
			teamName: teams.name,
		})
		.from(transactions)
		.leftJoin(teams, eq(transactions.teamId, teams.id))
		.where(
			and(
				or(
					inArray(transactions.teamId, t.map((team) => team.teamId).concat('any')),
					eq(transactions.userId, userId)
				),
				lte(transactions.date, to),
				gte(transactions.date, from)
			)
		)
		.groupBy(transactions.type, transactions.category, transactions.categoryIcon, transactions.teamId);

	return totals.map((t) => ({
		...t,
		category: t.teamName ? `${t.category} (${t.teamName})` : t.category,
		value: parseFloat(t.value || '0'),
	}));
}
