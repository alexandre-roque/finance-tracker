import { db } from '@/db';
import { bankingAccounts, categories } from '@/db/schema/finance';
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
