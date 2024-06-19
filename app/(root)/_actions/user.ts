'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function EditUser({
	avatarLink,
	name,
	excludeProfileImage,
}: {
	avatarLink: string;
	name: string;
	excludeProfileImage: boolean;
}) {
	if (!excludeProfileImage && avatarLink) {
		if (!isValidUrl(avatarLink)) {
			return { error: 'URL inválida' };
		}

		if (avatarLink.includes('data:image')) {
			return { error: 'Links com base64 não são suportados' };
		}
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	await db
		.update(users)
		.set({
			image: excludeProfileImage ? null : avatarLink ?? session.user.image,
			name: name ? name : session.user.name,
		})
		.where(eq(users.id, userId));

	return { success: true };
}

function isValidUrl(str: string) {
	try {
		new URL(str);
		return true;
	} catch (err) {
		return false;
	}
}
