export const revalidate = 0;

import { CreateTransaction } from '@/app/(root)/_actions/transactions';
import { db } from '@/db';
import { dailyRecurrenceCheckers, recurringTransactions } from '@/db/schema/finance';
import { getBusinessDayOfMonth, isWeekday } from '@/lib/utils';
import { and, eq, or } from 'drizzle-orm';

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

	const dayInMonth = date.getUTCDate();
	const businessDayCount = isWeekday(date) ? getBusinessDayOfMonth(date) : 380;

	const recurringTransactionsResult = await db
		.select()
		.from(recurringTransactions)
		.where(
			or(
				eq(recurringTransactions.businessDay, businessDayCount),
				eq(recurringTransactions.dayOfTheMonth, dayInMonth)
			)
		);

	if (recurringTransactionsResult && recurringTransactionsResult.length) {
		for (const recurringTransaction of recurringTransactionsResult) {
			const { dayOfTheMonth, businessDay, createdAt, updatedAt, ...transaction } = recurringTransaction;
			await CreateTransaction({
				...transaction,
				date: date,
				type: transaction.type === 'income' ? 'income' : 'expense',
				amount: transaction.amount ?? 0,
				isRecurring: false,
				bankingAccountId: transaction.bankingAccountId ?? undefined,
				category: transaction.categoryId ?? '',
				description: transaction.description ?? '',
				teamId: transaction.teamId ?? undefined,
				installments: 1,
				userId: transaction.userId,
				paymentType: transaction.paymentType as 'credit' | 'debit' | undefined,
			});
		}
	}

	return new Response(JSON.stringify(recurringTransactionsResult));
}
