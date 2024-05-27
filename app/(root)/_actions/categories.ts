'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories } from '@/db/schema/finance';
import {
	createCategorySchema,
	createCategorySchemaType,
	deleteCategorySchema,
	deleteCategorySchemaType,
} from '@/schemas';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function CreateCategory(form: createCategorySchemaType) {
	const parsedBody = createCategorySchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const { name, icon, type } = parsedBody.data;
	const [category] = await db
		.insert(categories)
		.values({
			userId: session.user.id,
			name,
			icon,
			type,
		})
		.returning();

	return category;
}

export async function DeleteCategory(form: deleteCategorySchemaType) {
	const parsedBody = deleteCategorySchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	return await db
		.delete(categories)
		.where(
			and(
				eq(categories.userId, session.user.id),
				eq(categories.name, parsedBody.data.name),
				eq(categories.type, parsedBody.data.type)
			)
		);
}
