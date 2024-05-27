import { auth } from '@/auth';
import { db } from '@/db';
import { monthHistories, yearHistories, yearHistoryType } from '@/db/schema/finance';
import { Period, Timeframe } from '@/lib/utils';
import { getDaysInMonth } from 'date-fns';
import { and, asc, eq, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const getHistoryDataSchema = z.object({
	timeframe: z.enum(['month', 'year']),
	month: z.coerce.number().min(0).max(11).default(0),
	year: z.coerce.number().min(2000).max(3000),
});

interface RequestBody {
	timeframe: 'month' | 'year';
	year: number;
	month: number;
}

export const POST = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const body: RequestBody = await req.json();
	const { timeframe, year, month } = body;

	const queryParams = getHistoryDataSchema.safeParse({
		timeframe,
		month,
		year,
	});

	if (!queryParams.success) {
		return Response.json(queryParams.error.message, {
			status: 400,
		});
	}

	const data = await getHistoryData(req.auth.user.id, queryParams.data.timeframe, {
		month: queryParams.data.month,
		year: queryParams.data.year,
	});

	return Response.json(data);
});

export type GetHistoryDataResponseType = Awaited<ReturnType<typeof getHistoryData>>;

async function getHistoryData(userId: string, timeframe: Timeframe, period: Period) {
	switch (timeframe) {
		case 'year':
			return await getYearHistoryData(userId, period.year);
		case 'month':
			return await getMonthHistoryData(userId, period.year, period.month);
	}
}

type HistoryData = {
	expense: number;
	income: number;
	year: number;
	month: number;
	day?: number;
};

async function getYearHistoryData(userId: string, year: number) {
	const result = await db
		.select({ expense: sum(yearHistories.expense), income: sum(yearHistories.income), month: yearHistories.month })
		.from(yearHistories)
		.where(and(eq(yearHistories.userId, userId), eq(yearHistories.year, year)))
		.orderBy(asc(yearHistories.month));

	if (!result || result.length === 0) return [];

	const history: HistoryData[] = [];

	for (let i = 0; i < 12; i++) {
		let expense = 0;
		let income = 0;

		const month = result.find((row) => row.month === i);
		if (month) {
			expense = parseFloat(month.expense || '0') || 0;
			income = parseFloat(month.income || '0') || 0;
		}

		history.push({
			year,
			month: i,
			expense,
			income,
		});
	}

	return history;
}

async function getMonthHistoryData(userId: string, year: number, month: number) {
	const result = await db
		.select({ expense: sum(monthHistories.expense), income: sum(monthHistories.income), day: monthHistories.day })
		.from(monthHistories)
		.where(and(eq(monthHistories.userId, userId), eq(monthHistories.year, year), eq(monthHistories.month, month)))
		.groupBy(monthHistories.day)
		.orderBy(asc(monthHistories.day));

	if (!result || result.length === 0) return [];

	const history: HistoryData[] = [];
	const daysInMonth = getDaysInMonth(new Date(year, month));
	for (let i = 1; i <= daysInMonth; i++) {
		let expense = 0;
		let income = 0;

		const day = result.find((row) => row.day === i);
		if (day) {
			expense = parseFloat(day.expense || '0') || 0;
			income = parseFloat(day.income || '0') || 0;
		}

		history.push({
			expense,
			income,
			year,
			month,
			day: i,
		});
	}

	return history;
}
