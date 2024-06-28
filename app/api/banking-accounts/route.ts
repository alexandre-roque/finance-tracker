export const revalidate = 0;

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
