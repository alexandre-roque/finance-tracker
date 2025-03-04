'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, macros } from '@/db/schema/finance';
import { createOrEditMacroSchema, createOrEditMacroSchemaType } from '@/schemas';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function CreateOrEditMacro(form: createOrEditMacroSchemaType) {
	const parsedBody = createOrEditMacroSchema.safeParse(form);
	if (!parsedBody.success) {
		return { error: parsedBody.error.message };
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	const { amount, categoryId, description, type, teamId, bankingAccountId, macroId, paymentType, name } =
		parsedBody.data;

	if (macroId) {
		const oldMacro = await db.query.macros.findFirst({
			where: (macros, { eq }) => eq(macros.id, macroId),
		});

		if (!oldMacro) {
			return { error: 'Macro não encontrado' };
		}

		try {
			await db
				.update(macros)
				.set({
					name,
					userId,
					amount,
					type,
					paymentType,
					teamId: teamId ?? null,
					bankingAccountId: bankingAccountId ?? null,
					description: description ?? '',
					categoryId: categoryId,
				})
				.where(eq(macros.id, macroId));
		} catch (error) {
			return { error: 'Erro ao editar macro' };
		}
	} else {
		await db.insert(macros).values({
			name,
			userId,
			amount,
			type,
			teamId: teamId ?? null,
			bankingAccountId: bankingAccountId ?? null,
			description: description ?? '',
			categoryId: categoryId ?? null,
		});
	}

	return { success: true };
}

export async function DeleteMacro({ macroId }: { macroId: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const macro = await db.query.macros.findFirst({
		where: (macro, { eq, and }) => and(eq(macro.id, macroId), eq(macro.userId, userId)),
	});

	if (!macro) {
		return { error: 'Macro não encontrado' };
	}

	try {
		await db.delete(macros).where(eq(macros.id, macroId));
	} catch (e) {
		return { error: JSON.stringify(e) };
	}

	return { success: true };
}
