import { auth } from '@/auth';
import { db } from '@/db';
import { pendingTeamAprovals, teams } from '@/db/schema/finance';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const userId = req.auth.user.id;
	const result = await db
		.select({
			guestId: pendingTeamAprovals.guestId,
			teamId: pendingTeamAprovals.teamId,
			inviterId: pendingTeamAprovals.inviterId,
			teamName: teams.name,
		})
		.from(pendingTeamAprovals)
		.leftJoin(teams, eq(pendingTeamAprovals.teamId, teams.id))
		.where(eq(pendingTeamAprovals.guestId, userId));

	return Response.json(result);
});
