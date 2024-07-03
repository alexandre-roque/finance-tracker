'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { creditCardInvoices, bankingAccounts } from '@/db/schema/finance';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function PayInvoice({
	invoiceId,
	isRecurring,
	recurringUserId,
}: {
	invoiceId: string;
	isRecurring?: boolean;
	recurringUserId?: string;
}) {
	let userId = '';
	if (!isRecurring) {
		const session = await auth();
		if (!session || !session.user || !session.user.id) {
			redirect('/sign-in');
		} else {
			userId = session.user.id;
		}
	} else {
		userId = recurringUserId ?? '';
	}

	const invoice = await db.query.creditCardInvoices.findFirst({
		where: (creditCardInvoices, { eq, and }) =>
			and(eq(creditCardInvoices.id, invoiceId), eq(creditCardInvoices.userId, userId)),
	});

	if (!invoice) {
		return { error: 'Fatura não encontrada' };
	}

	if (invoice.isPaid) {
		return { error: 'Fatura já paga' };
	}

	const bankingAccount = await db.query.bankingAccounts.findFirst({
		where: (bankingAccounts, { eq }) => eq(bankingAccounts.id, invoice.bankingAccountId),
	});

	if (!bankingAccount) {
		return { error: 'Conta bancária não encontrada' };
	}

	await db.transaction(async (trx) => {
		await trx
			.update(creditCardInvoices)
			.set({
				isPaid: true,
				paymentDate: new Date(),
			})
			.where(eq(creditCardInvoices.id, invoiceId));

		await trx
			.update(bankingAccounts)
			.set({
				balance: (bankingAccount.balance ?? 0) - invoice.amount,
			})
			.where(eq(bankingAccounts.id, invoice.bankingAccountId));
	});

	return { success: true };
}

export async function EditInvoice({ invoiceId, amount }: { invoiceId: string; amount: number }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const invoice = await db.query.creditCardInvoices.findFirst({
		where: (creditCardInvoices, { eq, and }) =>
			and(eq(creditCardInvoices.id, invoiceId), eq(creditCardInvoices.userId, userId)),
	});

	if (!invoice) {
		return { error: 'Fatura não encontrada' };
	}

	try {
		await db
			.update(creditCardInvoices)
			.set({
				amount: amount,
			})
			.where(eq(creditCardInvoices.id, invoiceId));
	} catch (error) {
		return { error: 'Erro ao editar fatura' };
	}

	return { success: true };
}

export async function DeleteInvoice({ invoiceId }: { invoiceId: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const invoice = await db.query.creditCardInvoices.findFirst({
		where: (creditCardInvoices, { eq, and }) =>
			and(eq(creditCardInvoices.id, invoiceId), eq(creditCardInvoices.userId, userId)),
	});

	if (!invoice) {
		return { error: 'Fatura não encontrada' };
	}

	try {
		await db.delete(creditCardInvoices).where(eq(creditCardInvoices.id, invoiceId));
	} catch (e) {
		return { error: JSON.stringify(e) };
	}

	return { success: true };
}
