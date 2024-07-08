export const revalidate = 0;

import { CreateTransaction } from '@/app/(root)/_actions/transactions';
import { db } from '@/db';
import { dailyRecurrenceCheckers, recurringTransactions } from '@/db/schema/finance';
import { getBusinessDayOfMonth, getLastBusinessDayOfTheMonth, isWeekday } from '@/lib/utils';
import { and, eq, or } from 'drizzle-orm';
import moment from 'moment';

export async function GET() {
	const date = new Date();
	const [dailyChecker] = await db
		.select()
		.from(dailyRecurrenceCheckers)
		.where(
			and(
				eq(dailyRecurrenceCheckers.day, date.getUTCDate()),
				eq(dailyRecurrenceCheckers.month, date.getUTCMonth()),
				eq(dailyRecurrenceCheckers.year, date.getUTCFullYear())
			)
		);

	if (dailyChecker) {
		throw new Error('Transações recorrentes já analisadas hoje!');
	}

	await db.insert(dailyRecurrenceCheckers).values({
		day: date.getUTCDate(),
		month: date.getUTCMonth(),
		year: date.getUTCFullYear(),
	});

	const nextMonthDate = moment(date).add(1, 'months').toDate();
	const dayInMonth = nextMonthDate.getUTCDate();
	const businessDayCount = isWeekday(nextMonthDate) ? getBusinessDayOfMonth(nextMonthDate) : 380;
	const lastBusinessDay = getLastBusinessDayOfTheMonth(nextMonthDate);
	const isLastBusinessDay = isWeekday(nextMonthDate) && (lastBusinessDay.getUTCDate() === dayInMonth);

	const whereQuery = isLastBusinessDay 
		? or(
			eq(recurringTransactions.businessDay, businessDayCount),
			eq(recurringTransactions.dayOfTheMonth, dayInMonth),
			eq(recurringTransactions.isLastBusinessDay, true),
		) 
		: or(
			eq(recurringTransactions.businessDay, businessDayCount),
			eq(recurringTransactions.dayOfTheMonth, dayInMonth),
		);

	const recurringTransactionsResult = await db
		.select()
		.from(recurringTransactions)
		.where(whereQuery);

	if (recurringTransactionsResult && recurringTransactionsResult.length) {
		for (const recurringTransaction of recurringTransactionsResult) {
			const { dayOfTheMonth, businessDay, createdAt, updatedAt, ...transaction } = recurringTransaction;
			await CreateTransaction({
				...transaction,
				date: nextMonthDate,
				type: transaction.type === 'income' ? 'income' : 'expense',
				amount: transaction.amount ?? 0,
				isRecurring: false,
				bankingAccountId: transaction.bankingAccountId ?? '',
				category: transaction.categoryId ?? '',
				description: transaction.description ?? '',
				teamId: transaction.teamId ?? undefined,
				installments: 1,
				userId: transaction.userId,
				paymentType: transaction.paymentType as 'credit' | 'debit' | undefined,
				recurrenceId: recurringTransaction.id,
			});
		}
	}

	return new Response(JSON.stringify(recurringTransactionsResult));
}
