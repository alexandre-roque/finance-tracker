'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { inviteTokens } from '@/db/schema/finance';
import { endOfDay } from 'date-fns';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function createInviteLink(teamId: string) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		return {
			data: null,
			error: 'Você precisa estar logado para gerar convites',
		};
	}

	const team = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.id, teamId),
		with: {
			members: true,
		},
	});

	if (!team) {
		return {
			data: null,
			error: 'Time não encontrado',
		};
	}

	if (
		!team.members.some((member) => member.userId === session.user!.id && ['owner', 'manager'].includes(member.role))
	) {
		return {
			data: null,
			error: 'Você não tem permissão para gerar convites',
		};
	}

	const token = uuidv4();
	const expiresAt = endOfDay(new Date());

	const invite = await db.query.inviteTokens.findFirst({
		where: (inviteTokens, { eq }) => eq(inviteTokens.teamId, teamId),
	});

	if (invite) {
		if (invite.expiresAt > new Date()) {
			return {
				data: `${process.env.NEXTAUTH_URL!}/invite/${invite.token}`,
				error: null,
			};
		} else {
			await db.delete(inviteTokens).where(eq(inviteTokens.teamId, teamId));
		}
	}

	await db.insert(inviteTokens).values({
		teamId: teamId,
		token: token,
		expiresAt: expiresAt,
	});

	return {
		data: `${process.env.NEXTAUTH_URL!}/invite/${token}`,
		error: null,
	};
}
