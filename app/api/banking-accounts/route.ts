import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { bankingAccounts } from '@/db/schema/finance';

export const GET = auth(async (req) => {
	if (req.auth?.user?.id) {
		const selectedBankingAccounts = await db
			.select()
			.from(bankingAccounts)
			.where(eq(bankingAccounts.userId, req.auth.user.id));
		return Response.json(selectedBankingAccounts, { status: 200 });
	} else {
		redirect('/sign-in');
	}
});

export const POST = auth(async (req) => {
	if (req.auth?.user?.id) {
		const requestBody = await req.json();
		if (!requestBody.bankingAccountId) {
			try {
				const [bankingAccount] = await db
					.insert(bankingAccounts)
					.values({
						userId: req.auth.user.id,
						description: requestBody.description,
						name: requestBody.name,
					})
					.returning();
				return Response.json(bankingAccount, { status: 200 });
			} catch (e) {
				return Response.json({ message: 'Erro ao criar conta bancária' }, { status: 400 });
			}
		} else {
			try {
				const [bankingAccount] = await db
					.update(bankingAccounts)
					.set({
						description: requestBody.description,
						name: requestBody.name,
					})
					.where(eq(bankingAccounts.id, requestBody.bankingAccountId))
					.returning();
				return Response.json(bankingAccount, { status: 200 });
			} catch (e) {
				return Response.json({ message: 'Erro ao editar conta bancária' }, { status: 400 });
			}
		}
	} else {
		redirect('/sign-in');
	}
});
