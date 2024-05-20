import * as bcrypt from 'bcrypt';

import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq, sql } from 'drizzle-orm';

interface RequestBody {
	email: string;
	password: string;
}

export async function POST(request: Request) {
	const body: RequestBody = await request.json();

	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			emailVerified: users.emailVerified,
			image: users.image,
			password: users.password,
		})
		.from(users)
		.where(eq(users.email, body.email));

	if (user && user.password && (await bcrypt.compare(body.password, user.password))) {
		const { password, ...userWithoutPass } = user;
		return new Response(JSON.stringify(userWithoutPass));
	} else {
		return new Response(JSON.stringify(null));
	}
}
