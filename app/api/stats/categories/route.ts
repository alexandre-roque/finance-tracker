export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { transactions } from '@/db/schema/finance';
import { OverviewQuerySchema } from '@/schemas';
import { and, eq, gte, lte, sum } from 'drizzle-orm';
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
	const totals = await db
		.select({
			value: sum(transactions.amount),
			type: transactions.type,
			category: transactions.category,
			categoryIcon: transactions.categoryIcon,
		})
		.from(transactions)
		.where(and(eq(transactions.userId, userId), lte(transactions.date, to), gte(transactions.date, from)))
		.groupBy(transactions.type, transactions.category, transactions.categoryIcon);

	return totals.map((t) => ({ ...t, value: parseFloat(t.value || '0') }));
}
