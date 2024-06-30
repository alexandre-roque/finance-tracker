export const revalidate = 0;

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { bankingAccounts, categories, userSettings } from '@/db/schema/finance';

export const GET = auth(async (req) => {
	const userId = req.auth?.user?.id;
	if (userId) {
		let result;

		const userSetting = await db.query.userSettings.findFirst({
			where: (userSettings, { eq }) => eq(userSettings.userId, userId),
		});

		if (userSetting) {
			result = userSetting;
		} else {
			[result] = await db
				.insert(userSettings)
				.values({
					userId: userId,
					currency: 'BRL',
				})
				.returning();

			try {
				// Criar categorias padrões para o usuário
				const defaultCategories = [
					{
						name: 'Mercado',
						icon: '🛒',
						type: 'expense',
					},
					{
						name: 'Transporte',
						icon: '🚗',
						type: 'expense',
					},
					{
						name: 'Lazer',
						icon: '🎮',
						type: 'expense',
					},
					{
						name: 'Saúde',
						icon: '🏥',
						type: 'expense',
					},
					{
						name: 'Educação',
						icon: '📚',
						type: 'expense',
					},
					{
						name: 'Outros',
						icon: '💸',
						type: 'expense',
					},
					{
						name: 'Salário',
						icon: '💰',
						type: 'income',
					},
					{
						name: 'Vale alimentação',
						icon: '🍔',
						type: 'income',
					},
				];

				for (const category of defaultCategories) {
					await db.insert(categories).values({
						...category,
						userId,
					});
				}

				await db.insert(bankingAccounts).values({
					name: 'Conta principal',
					userId,
				});
			} catch (e) {}

			revalidatePath('/');
		}

		return Response.json(result, { status: 200 });
	} else {
		redirect('/sign-in');
	}
});
