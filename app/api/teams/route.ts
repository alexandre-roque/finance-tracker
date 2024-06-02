export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const { searchParams } = new URL(req.url);
	const withMembers = searchParams.get('withMembers');

	const userId = req.auth.user.id;

	const result = await db.query.teamMembers.findMany({
		with: withMembers
			? {
					team: {
						with: {
							members: {
								columns: {
									userId: true,
									role: true,
									status: true,
								},
								with: {
									user: {
										columns: {
											name: true,
										},
									},
								},
							},
							owner: {
								columns: {
									name: true,
								},
							},
						},
					},
			  }
			: {
					team: true,
			  },
		where: (teamMembers, { eq }) => eq(teamMembers.userId, userId),
	});

	return Response.json(result);
});
