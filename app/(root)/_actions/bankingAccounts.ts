'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts } from '@/db/schema/finance';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

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
