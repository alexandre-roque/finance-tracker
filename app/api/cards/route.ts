import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { cards } from '@/db/schema/finance';

export const GET = auth(async (req) => {
	if (req.auth?.user?.id) {
		const selectedCards = await db.select().from(cards).where(eq(cards.userId, req.auth.user.id));
		return Response.json(selectedCards, { status: 200 });
	} else {
		redirect('/sign-in');
	}
});

export const POST = auth(async (req) => {
	if (req.auth?.user?.id) {
		const requestBody = await req.json();
		try {
			const card = await db
				.insert(cards)
				.values({
					userId: req.auth.user.id,
					number: requestBody.number,
					name: requestBody.name,
				})
				.returning();
			return Response.json(card, { status: 200 });
		} catch (e) {
			return Response.json({ message: 'Erro ao criar cartão' }, { status: 400 });
		}
	} else {
		redirect('/sign-in');
	}
});
