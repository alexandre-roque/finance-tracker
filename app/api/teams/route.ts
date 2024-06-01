export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { teamMembers } from '@/db/schema/finance';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const userId = req.auth.user.id;
	const result = await db.query.teamMembers.findMany({
		with: {
			team: true,
		},
		where: (teamMembers, { eq }) => eq(teamMembers.userId, userId),
	});

	return Response.json(result);
});
