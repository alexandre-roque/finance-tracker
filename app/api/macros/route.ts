export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const macros = await getMacros(req.auth.user.id);

	return Response.json(macros);
});

export type GetMacrosResponseType = Awaited<ReturnType<typeof getMacros>>;

async function getMacros(userId: string) {
	const macrosResult = await db.query.macros.findMany({
		with: {
			team: {
				columns: {
					name: true,
				},
			},
			bankingAccount: {
				columns: {
					name: true,
				},
			},
			category: {
				columns: {
					name: true,
					icon: true,
				},
			},
		},
		where: (macros, { eq }) => eq(macros.userId, userId),
	});

	return macrosResult;
}
