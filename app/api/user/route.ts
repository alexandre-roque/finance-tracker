import { db } from '@/db';
import { categories } from '@/db/schema/finance';
import { users } from '@/db/schema/users';
import * as bcrypt from 'bcrypt';

interface RequestBody {
	name: string;
	email: string;
	password: string;
}

export async function POST(request: Request) {
	const body: RequestBody = await request.json();

	try {
		const user = await db
			.insert(users)
			.values({
				name: body.name,
				email: body.email,
				password: await bcrypt.hash(body.password, 10),
			})
			.returning();

		const [{ password, ...result }] = user;

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
					userId: result.id,
				});
			}
		} catch (e) {}

		return new Response(
			JSON.stringify({
				user: result,
				success: true,
			})
		);
	} catch (e) {
		return new Response(
			JSON.stringify({
				user: null,
				success: false,
				errorMessage: e,
			})
		);
	}
}
