export const revalidate = 0;

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { userSettings } from '@/db/schema/finance';

export const GET = auth(async (req) => {
	if (req.auth?.user?.id) {
		let result;

		const [userSetting] = await db.select().from(userSettings).where(eq(userSettings.userId, req.auth.user.id));

		if (userSetting) {
			result = userSetting;
		} else {
			result = await db.insert(userSettings).values({
				userId: req.auth.user.id,
				currency: 'BRL',
			});
			
			revalidatePath('/');
		}

		return Response.json(result, { status: 200 });
	} else {
		redirect('/sign-in');
	}
});
