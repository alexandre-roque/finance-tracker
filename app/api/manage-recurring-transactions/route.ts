import { CreateTransaction } from '@/app/(root)/_actions/transactions';
import { db } from '@/db';
import { recurringTransactions } from '@/db/schema/finance';
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

function isWeekday(date: Date) {
	const day = date.getDay();
	return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
}

function getBusinessDayOfMonth(date: Date) {
	const year = date.getFullYear();
	const month = date.getMonth();
	const dayOfMonth = date.getDate();
	let businessDayCount = 0;

	for (let day = 1; day <= dayOfMonth; day++) {
		const currentDate = new Date(year, month, day);
		if (isWeekday(currentDate)) {
			businessDayCount++;
		}
	}

	return businessDayCount;
}
