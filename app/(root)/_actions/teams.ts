'use server';

import { auth } from '@/auth';
import { ResultQueryNotifications } from '@/components/NotificationsPopOver';
import { db } from '@/db';
import { pendingTeamAprovals, teamMembers, teams } from '@/db/schema/finance';
import {
	createTeamSchema,
	createTeamSchemaType,
	editTeamMemberSchema,
	editTeamMemberSchemaType,
	editTeamSchema,
	editTeamSchemaType,
	inviteToTeamSchema,
	inviteToTeamSchemaType,
} from '@/schemas';
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
		return { error: 'Não é possível se convidar' };
	}

	const invitee = await db.query.users.findFirst({
		columns: {
			id: true,
		},
		where: (users, { eq }) => eq(users.email, email),
	});

	if (!invitee) {
		return { error: 'Usuário não encontrado' };
	}

	try {
		const [invite] = await db
			.insert(pendingTeamAprovals)
			.values({
				guestId: invitee?.id,
				inviterId: userId,
				teamId,
			})
			.returning();

		return invite;
	} catch (e) {
		return { error: 'Usuário já foi convidado' };
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

export async function DeleteTeamMember(form: { teamMemberId: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const { teamMemberId } = form;

	const teamMemberToDelete = await db.query.teamMembers.findFirst({
		columns: {
			userId: true,
			teamId: true,
		},
		where: (teamMembers, { eq }) => eq(teamMembers.id, teamMemberId),
	});

	if (!teamMemberToDelete) {
		return { error: 'Membro não encontrado' };
	}

	if (userId === teamMemberToDelete.userId) {
		return { error: 'Você não pode sair do seu próprio time' };
	}

	await db.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));

	return { success: true };
}

export async function EditTeamMember(form: editTeamMemberSchemaType) {
	const parsedBody = editTeamMemberSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const { teamMemberId, role, status } = parsedBody.data;

	const teamMemberToEdit = await db.query.teamMembers.findFirst({
		columns: {
			userId: true,
			teamId: true,
		},
		where: (teamMembers, { eq }) => eq(teamMembers.id, teamMemberId),
	});

	if (!teamMemberToEdit) {
		return { error: 'Membro não encontrado' };
	}

	const team = await db.query.teams.findFirst({
		with: {
			members: true,
		},
		where: (teams, { eq }) => eq(teams.id, teamMemberToEdit.teamId),
	});

	if (!team) {
		return { error: 'Time não encontrado' };
	}

	if (
		team.ownerId !== userId ||
		!team.members.some(
			(member) => member.userId === userId && (member.role === 'manager' || member.role === 'owner')
		)
	) {
		return { error: 'Você não tem permissão de editar o membro de time' };
	}

	const [editedTeamMember] = await db
		.update(teamMembers)
		.set({
			role,
			status,
		})
		.where(eq(teamMembers.id, teamMemberId))
		.returning();

	return { success: true, editedTeamMember };
}

export async function EditTeam(form: editTeamSchemaType) {
	const parsedBody = editTeamSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error('bad request');
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const { name, description, splitType, members } = parsedBody.data;

	const team = await db.query.teams.findFirst({
		with: {
			members: true,
		},
		where: (teams, { eq }) => eq(teams.id, form.teamId),
	});

	if (!team) {
		return { error: 'Time não encontrado' };
	}

	if (
		team.ownerId !== userId ||
		!team.members.some(
			(member) => member.userId === userId && (member.role === 'manager' || member.role === 'owner')
		)
	) {
		return { error: 'Você não tem permissão de editar o time' };
	}

	if (splitType === 'percentage') {
		const totalPercentage = members.reduce((acc, member) => acc + member.percentage, 0);
		if (totalPercentage !== 100) {
			return { error: 'A soma dos percentuais deve ser 100' };
		}
	}

	await db
		.update(teams)
		.set({
			name,
			description,
			splitType,
		})
		.where(eq(teams.id, form.teamId));

	for (const member of members) {
		const teamMember = team.members.find((m) => m.id === member.id);
		if (!teamMember) {
			continue;
		}

		await db
			.update(teamMembers)
			.set({
				percentage: member.percentage,
			})
			.where(eq(teamMembers.id, member.id));
	}

	return { success: true };
}
