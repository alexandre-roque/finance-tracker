'use server';

import { auth } from '@/auth';
import { ResultQueryNotifications } from '@/components/NotificationsPopOver';
import { db } from '@/db';
import { pendingTeamAprovals, teamMembers, teams } from '@/db/schema/finance';
import { createTeamSchema, createTeamSchemaType, inviteToTeamSchema, inviteToTeamSchemaType } from '@/schemas';
import { and, eq } from 'drizzle-orm';
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

export async function CreateTeamInvitation(form: inviteToTeamSchemaType) {
	console.log('entrou aqui', form);
	const parsedBody = inviteToTeamSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const userEmail = session.user.email;
	const { email, teamId } = parsedBody.data;

	if (email === userEmail) {
		throw new Error('Não é possível se convidar');
	}

	const invitee = await db.query.users.findFirst({
		columns: {
			id: true,
		},
		where: (users, { eq }) => eq(users.email, email),
	});

	if (!invitee) {
		throw new Error('Usuário não encontrado');
	}

	try {
		const invite = await db
			.insert(pendingTeamAprovals)
			.values({
				guestId: invitee?.id,
				inviterId: userId,
				teamId,
			})
			.returning();

		return invite;
	} catch (e) {
		throw new Error('Usuário já foi convidado');
	}
}

export async function HandleTeamInvitation({
	wasAccepted,
	invitation,
}: {
	wasAccepted: boolean;
	invitation: ResultQueryNotifications;
}) {
	if (wasAccepted) {
		await db
			.insert(teamMembers)
			.values({
				userId: invitation.guestId,
				teamId: invitation.teamId,
				role: 'member',
			})
			.returning();

		await db
			.delete(pendingTeamAprovals)
			.where(
				and(
					eq(pendingTeamAprovals.guestId, invitation.guestId),
					eq(pendingTeamAprovals.teamId, invitation.teamId)
				)
			);
	} else {
		await db
			.delete(pendingTeamAprovals)
			.where(
				and(
					eq(pendingTeamAprovals.guestId, invitation.guestId),
					eq(pendingTeamAprovals.teamId, invitation.teamId)
				)
			);
	}

	return { accepted: wasAccepted };
}
