import { CreateTransaction } from '@/app/(root)/_actions/transactions';
import { db } from '@/db';
import { recurringTransactions } from '@/db/schema/finance';
import { getBusinessDayOfMonth } from '@/lib/utils';
import { eq, or } from 'drizzle-orm';

export async function GET() {
	const date = new Date();
	const dayInMonth = date.getUTCDate();
	const businessDayCount = getBusinessDayOfMonth(date);

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
				card: transaction.cardId ?? '',
				date: new Date(),
				type: transaction.type === 'income' ? 'income' : 'expense',
				amount: transaction.amount ?? 0,
				isRecurring: false,
				category: transaction.category ?? '',
				description: transaction.description ?? '',
				teamId: transaction.teamId ?? undefined,
			});
		}
	}

	return new Response(JSON.stringify(recurringTransactionsResult));
}
