export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { categories } from '@/db/schema/finance';
import { and, eq, inArray, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from '@/lib/i18nZod';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const userId = req.auth.user.id;
	const { searchParams } = new URL(req.url);
	const type = searchParams.get('type');
	const onlyFromUser = searchParams.get('onlyFromUser');

	const validator = z.enum(['expense', 'income']).nullable();

	const queryParams = validator.safeParse(type);
	if (!queryParams.success) {
		return Response.json(queryParams.error, {
			status: 400,
		});
	}

	const teams = await db.query.teamMembers.findMany({
		with: {
			team: {
				with: {
					members: {
						columns: {
							userId: true,
						},
					},
				},
			},
		},
		where: (teamMembers, { eq }) => eq(teamMembers.userId, userId),
	});

	if (!onlyFromUser) {
		const userIdConstraint = or(
			and(
				inArray(
					categories.userId,
					[userId].concat(teams.flatMap((team) => team.team.members.map((member) => member.userId)))
				),
				eq(categories.sharable, true)
			),
			eq(categories.userId, userId)
		);

		const constraint = type ? and(userIdConstraint, eq(categories.type, type)) : userIdConstraint;

		const resultCategories = await db.select().from(categories).where(constraint);
		return Response.json(resultCategories);
	}
	const constraint = and(eq(categories.userId, userId), type ? eq(categories.type, type) : undefined);
	const resultCategories = await db.select().from(categories).where(constraint);
	return Response.json(resultCategories);
});
