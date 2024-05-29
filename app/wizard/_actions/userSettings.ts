'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { updateUserCurrencySchema } from '@/schemas';
import { userSettings } from '@/db/schema/finance';
import { db } from '@/db';

export async function UpdateUserCurrency(currency: string) {
	const parsedBody = updateUserCurrencySchema.safeParse({
		currency,
	});

	if (!parsedBody.success) {
		throw parsedBody.error;
	}

	const session = await auth();
	if (!session || !session.user) {
		redirect('/sign-in');
	}

	const [userSettingsResult] = await db
		.update(userSettings)
		.set({ currency: currency })
		.where(eq(userSettings.userId, session.user.id!))
		.returning();

	return userSettingsResult;
}
export async function UpdateUserCard(cardId: string | null) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const [userSettingsResult] = await db
		.update(userSettings)
		.set({ mainCard: cardId })
		.where(eq(userSettings.userId, session.user.id))
		.returning();

	return userSettingsResult;
}

export async function UpdateUserCategory({ categoryId, type }: { categoryId?: string | null; type: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const [userSettingsResult] = await db
		.update(userSettings)
		.set(type === 'income' ? { mainIncomeCategory: categoryId } : { mainExpenseCategory: categoryId })
		.where(eq(userSettings.userId, session.user.id))
		.returning();

	return userSettingsResult;
}
