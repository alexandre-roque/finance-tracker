import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { bankingAccounts } from '@/db/schema/finance';

export const GET = auth(async (req) => {
	if (req.auth?.user?.id) {
		const selectedCards = await db
			.select()
			.from(bankingAccounts)
			.where(eq(bankingAccounts.userId, req.auth.user.id));
		return Response.json(selectedCards, { status: 200 });
	} else {
		redirect('/sign-in');
	}
});

export const POST = auth(async (req) => {
	if (req.auth?.user?.id) {
		const requestBody = await req.json();
		try {
			const bankingAccount = await db
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
		redirect('/sign-in');
	}
});
