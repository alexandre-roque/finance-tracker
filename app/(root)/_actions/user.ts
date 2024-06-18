'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function EditUser({ avatarLink, name }: { avatarLink: string; name: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	await db
		.update(users)
		.set({ image: avatarLink ?? session.user.image, name: name ? name : session.user.name })
		.where(eq(users.id, userId));
}
