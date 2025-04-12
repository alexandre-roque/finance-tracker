export const revalidate = 0;

import { PayInvoice } from '@/app/(root)/_actions/invoices';
import { db } from '@/db';
import { bankingAccounts, creditCardInvoices, dailyDebitCheckers } from '@/db/schema/finance';
import { and, eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const dateFromUrl = searchParams.get('date');
	const date = dateFromUrl ? new Date(dateFromUrl) : new Date();

	const [dailyChecker] = await db
		.select()
		.from(dailyDebitCheckers)
		.where(
			and(
				eq(dailyDebitCheckers.day, date.getUTCDate()),
				eq(dailyDebitCheckers.month, date.getUTCMonth()),
				eq(dailyDebitCheckers.year, date.getUTCFullYear())
			)
		);

	if (dailyChecker) {
		throw new Error('Transações recorrentes já analisadas hoje!');
	}

	await db.insert(dailyDebitCheckers).values({
		day: date.getUTCDate(),
		month: date.getUTCMonth(),
		year: date.getUTCFullYear(),
	});

	const accountsWithPayDayToday = await db
		.select()
		.from(bankingAccounts)
		.where(and(eq(bankingAccounts.payDay, date.getUTCDate()), eq(bankingAccounts.automaticDebitInvoices, true)));

	for (const account of accountsWithPayDayToday) {
		const creditCardInvoicesResult = await db
			.select()
			.from(creditCardInvoices)
			.where(
				and(
					eq(creditCardInvoices.isPaid, false),
					eq(creditCardInvoices.year, date.getUTCFullYear()),
					sql`month = ${date.getUTCMonth()} - CASE WHEN ${account.payDay} < ${
						account.closeDay
					} THEN 2 ELSE 1 END`
				)
			);

		for (const invoice of creditCardInvoicesResult) {
			await PayInvoice({ invoiceId: invoice.id, isRecurring: true, recurringUserId: account.userId });
		}
	}

	return new Response(JSON.stringify(accountsWithPayDayToday));
}
