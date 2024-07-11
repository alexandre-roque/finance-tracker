export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts, creditCardInvoices } from '@/db/schema/finance';
import { and, eq, lt, sum } from 'drizzle-orm';
import moment from 'moment';
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
	const [balance] = await db
		.select({ value: sum(bankingAccounts.balance) })
		.from(bankingAccounts)
		.where(and(eq(bankingAccounts.userId, userId), eq(bankingAccounts.hideInBalance, false)));

	const [totalCredit] = await db
		.select({ value: sum(creditCardInvoices.amount) })
		.from(creditCardInvoices)
		.where(and(eq(creditCardInvoices.userId, userId), eq(creditCardInvoices.isPaid, false)));

	const m = moment.utc();

	const currentDay = m.date();
	const currentMonth = m.month();
	const prevMonth = moment(m).subtract(1, 'months').month();
	const nextMonth = moment(m).add(1, 'months').month();

	const accountsThatClosesBeforeToday = await db.query.bankingAccounts.findMany({
		where: (bankingAccounts, { lt, eq, and }) =>
			and(lt(bankingAccounts.closeDay, currentDay), eq(bankingAccounts.userId, userId)),
		with: {
			creditCardInvoices: {
				where: (creditCardInvoices, { eq, or, and }) =>
					and(
						or(eq(creditCardInvoices.month, currentMonth), eq(creditCardInvoices.month, nextMonth)),
						eq(creditCardInvoices.isPaid, false)
					),
			},
		},
	});

	const accountsThatClosed = await db.query.bankingAccounts.findMany({
		where: (bankingAccounts, { gte }) =>
			and(gte(bankingAccounts.closeDay, currentDay), eq(bankingAccounts.userId, userId)),
		with: {
			creditCardInvoices: {
				where: (creditCardInvoices, { eq, or, and }) =>
					and(
						or(eq(creditCardInvoices.month, currentMonth), eq(creditCardInvoices.month, prevMonth)),
						eq(creditCardInvoices.isPaid, false)
					),
			},
		},
	});

	const currentCredit = {
		value: accountsThatClosesBeforeToday.reduce(
			(acc, account) =>
				acc +
				account.creditCardInvoices.reduce((acc, invoice) => {
					if (invoice.month === currentMonth) {
						return acc + invoice.amount;
					}

					return acc;
				}, 0),
			0
		),
	};

	currentCredit.value += accountsThatClosed.reduce(
		(acc, account) =>
			acc +
			account.creditCardInvoices.reduce((acc, invoice) => {
				if (invoice.month === prevMonth) {
					return acc + invoice.amount;
				}

				return acc;
			}, 0),
		0
	);

	const nextCredit = {
		value: accountsThatClosesBeforeToday.reduce(
			(acc, account) =>
				acc +
				account.creditCardInvoices.reduce((acc, invoice) => {
					if (invoice.month === nextMonth) {
						return acc + invoice.amount;
					}

					return acc;
				}, 0),
			0
		),
	};

	nextCredit.value += accountsThatClosed.reduce(
		(acc, account) =>
			acc +
			account.creditCardInvoices.reduce((acc, invoice) => {
				if (invoice.month === currentMonth) {
					return acc + invoice.amount;
				}

				return acc;
			}, 0),
		0
	);

	return {
		balance,
		totalCredit,
		currentCredit,
		nextCredit,
		accountsThatClosed,
		accountsThatClosesBeforeToday,
	};
}
