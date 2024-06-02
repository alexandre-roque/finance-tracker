export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { yearHistories } from '@/db/schema/finance';
import { and, eq, asc } from 'drizzle-orm';
import { year } from 'drizzle-orm/mysql-core';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const result = await db
		.select({
			expense: yearHistories.expense,
			income: yearHistories.income,
			month: yearHistories.month,
			teamId: yearHistories.teamId,
		})
		.from(yearHistories)
		.groupBy(yearHistories.teamId)
		.orderBy(asc(yearHistories.month));

	return Response.json(result);
});
