export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { monthHistories } from '@/db/schema/finance';
import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const periods = await getHistoryPeriods(req.auth.user.id);
	return Response.json(periods);
});

export type GetHistoryPeriodsResponseType = Awaited<ReturnType<typeof getHistoryPeriods>>;

async function getHistoryPeriods(userId: string) {
	const result = await db
		.selectDistinct({ year: monthHistories.year })
		.from(monthHistories)
		.where(eq(monthHistories.userId, userId))
		.orderBy(asc(monthHistories.year));

	if (result.length === 0) {
		// Return the current year
		return [new Date().getFullYear()];
	}

	return result.map((el) => el.year);
}
