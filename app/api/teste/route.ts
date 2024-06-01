export const revalidate = 0;

import { auth } from '@/auth';
import { db } from '@/db';
import { redirect } from 'next/navigation';

export const GET = auth(async (req) => {
	if (!req.auth?.user?.id) {
		redirect('/sign-in');
	}

	const userId = req.auth.user.id;

	// const result = await db.query.teams.findMany({
	// 	with:{
	// 		members: {
	// 			where: 
	// 		}
	// 	},
    //     where:
	// });
	
	return Response.json([]);
});

