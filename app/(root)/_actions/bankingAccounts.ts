'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts } from '@/db/schema/finance';
import { createBankingAccountSchema, createBankingAccountSchemaType } from '@/schemas';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function CreateOrUpdateBankingAccount(form: createBankingAccountSchemaType) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const parsedBody = createBankingAccountSchema.safeParse(form);
	if (!parsedBody.success) {
		return { error: parsedBody.error.message };
	}

	if (!parsedBody.data.bankingAccountId) {
		try {
			await db
				.insert(bankingAccounts)
				.values({
					userId: session.user.id,
					description: parsedBody.data.description,
					name: parsedBody.data.name,
					payDay: parsedBody.data.payDay,
					closeDay: parsedBody.data.closeDay,
				})
				.returning();
			return { success: true };
		} catch (e) {
			return { error: 'Erro ao criar conta bancária' };
		}
	} else {
		try {
			await db
				.update(bankingAccounts)
				.set({
					description: parsedBody.data.description,
					name: parsedBody.data.name,
					payDay: parsedBody.data.payDay,
					closeDay: parsedBody.data.closeDay,
				})
				.where(
					and(
						eq(bankingAccounts.id, parsedBody.data.bankingAccountId),
						eq(bankingAccounts.userId, session.user.id)
					)
				)
				.returning();
			return { success: true };
		} catch (e) {
			return { error: 'Erro ao editar conta bancária' };
		}
	}
}

export async function DeleteBankingAccount(form: { bankingAccountId: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const { bankingAccountId } = form;

	return await db
		.delete(bankingAccounts)
		.where(and(eq(bankingAccounts.userId, session.user.id), eq(bankingAccounts.id, bankingAccountId)))
		.returning();
}
