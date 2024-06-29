export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts, creditCardInvoices } from '@/db/schema/finance';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	return Response.json(await getInvoices(req.auth.user.id));
});

export type GetInvoicesResponseType = Awaited<ReturnType<typeof getInvoices>>;

async function getInvoices(userId: string) {
	const bankingAccountsResult = await db.query.bankingAccounts.findMany({
		where: (bankingAccounts, { eq }) => eq(bankingAccounts.userId, userId),
		with: {
			creditCardInvoices: {
				orderBy: (creditCardInvoices, { asc }) =>
					asc(sql`(${creditCardInvoices.year} * 100 + ${creditCardInvoices.month})`),
			},
		},
	});

	return bankingAccountsResult;
}
