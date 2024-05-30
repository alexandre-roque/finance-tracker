export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { categories } from '@/db/schema/finance';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const { searchParams } = new URL(req.url);
	const type = searchParams.get('type');

	const validator = z.enum(['expense', 'income']).nullable();

	const queryParams = validator.safeParse(type);
	if (!queryParams.success) {
		return Response.json(queryParams.error, {
			status: 400,
		});
	}

	const constraint = type
		? and(eq(categories.userId, req.auth.user.id), eq(categories.type, type))
		: eq(categories.userId, req.auth.user.id);

	const resultCategories = await db.select().from(categories).where(constraint);
	return Response.json(resultCategories);
});
