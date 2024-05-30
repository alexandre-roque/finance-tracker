'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { teamMembers, teams } from '@/db/schema/finance';
import { createTeamSchema, createTeamSchemaType } from '@/schemas';
import { redirect } from 'next/navigation';

export async function CreateTeam(form: createTeamSchemaType) {
	const parsedBody = createTeamSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const { name, description } = parsedBody.data;
	const [team] = await db
		.insert(teams)
		.values({
			ownerId: userId,
			name,
			description: description || '',
		})
		.returning();

	await db.insert(teamMembers).values({
		userId,
		teamId: team.id,
		role: 'owner',
	});

	return team;
}
