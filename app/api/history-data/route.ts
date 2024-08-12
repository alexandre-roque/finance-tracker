export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { teamMembers } from '@/db/schema/finance';
import { Period, Timeframe, hashStringToHSL, orangeHSLToGreenHSL } from '@/lib/utils';
import { getDaysInMonth } from 'date-fns';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from '@/lib/i18nZod';

const getHistoryDataSchema = z.object({
	timeframe: z.enum(['month', 'year']),
	month: z.coerce.number().min(0).max(11).default(0),
	year: z.coerce.number().min(2000).max(3000),
});

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const { searchParams } = new URL(req.url);
	const timeframe = searchParams.get('timeframe');
	const year = searchParams.get('year');
	const month = searchParams.get('month');

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
	const teams = (
		await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId))
	).map((obj) => obj.teamId);

	const result = await db.query.yearHistories.findMany({
		columns: {
			expense: true,
			income: true,
			month: true,
			teamId: true,
		},
		with: {
			team: {
				columns: {
					name: true,
					id: true,
				},
			},
		},
		where: (yearHistories, { and, or, inArray, eq }) =>
			and(
				or(inArray(yearHistories.teamId, teams.concat('any')), eq(yearHistories.userId, userId)),
				eq(yearHistories.year, year)
			),
		orderBy: (yearHistories, { asc }) => asc(yearHistories.month),
	});

	if (!result || result.length === 0) return [];

	const history = [];

	for (let i = 0; i < 12; i++) {
		const obj: any = {
			income: 0,
			expense: 0,
		};

		const months = result.filter((row) => row.month === i);
		months.forEach((month) => {
			if (month.team) {
				const expenseColor = hashStringToHSL(month.team.name);
				const expenseKey = `expense_${month.team.name}_${expenseColor}`;
				const incomeKey = `income_${month.team.name}_${orangeHSLToGreenHSL(expenseColor)}`;

				obj[expenseKey] = (obj[expenseKey] ?? 0) + (month.expense ?? 0);
				obj[incomeKey] = (obj[incomeKey] ?? 0) + (month.income ?? 0);
			} else {
				obj.income += month.income ?? 0;
				obj.expense += month.expense ?? 0;
			}
		});

		history.push({
			year,
			month: i,
			...obj,
		});
	}

	return history;
}

async function getMonthHistoryData(userId: string, year: number, month: number) {
	const teams = (
		await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId))
	).map((obj) => obj.teamId);

	const result = await db.query.monthHistories.findMany({
		columns: {
			expense: true,
			income: true,
			month: true,
			day: true,
			teamId: true,
		},
		with: {
			team: {
				columns: {
					name: true,
					id: true,
				},
			},
		},
		where: (monthHistories, { and, or, inArray, eq }) =>
			and(
				or(inArray(monthHistories.teamId, teams.concat('any')), eq(monthHistories.userId, userId)),
				eq(monthHistories.month, month)
			),
		orderBy: (monthHistories, { asc }) => asc(monthHistories.day),
	});

	if (!result || result.length === 0) return [];

	const history = [];
	const daysInMonth = getDaysInMonth(new Date(year, month));
	for (let i = 1; i <= daysInMonth; i++) {
		const obj: any = {
			income: 0,
			expense: 0,
		};

		const days = result.filter((row) => row.day === i);
		days.forEach((day) => {
			if (day.team) {
				const expenseColor = hashStringToHSL(day.team.name);
				const expenseKey = `expense_${day.team.name}_${expenseColor}`;
				const incomeKey = `income_${day.team.name}_${orangeHSLToGreenHSL(expenseColor)}`;

				obj[expenseKey] = (obj[expenseKey] ?? 0) + (day.expense ?? 0);
				obj[incomeKey] = (obj[incomeKey] ?? 0) + (day.income ?? 0);
			} else {
				obj.income += day.income ?? 0;
				obj.expense += day.expense ?? 0;
			}
		});

		history.push({
			year,
			month,
			day: i,
			...obj,
		});
	}

	return history;
}
