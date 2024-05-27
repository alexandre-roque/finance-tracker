import { z } from 'zod';
import { Currencies } from '@/lib/currencies';

export const authFormSchema = (type: string) =>
	z.object({
		// sign up
		name: type === 'sign-in' ? z.string().optional() : z.string().min(3),
		// both
		email: z.string().email(),
		password: z.string().min(8),
	});

export const updateUserCurrencySchema = z.object({
	currency: z.custom((value) => {
		const found = Currencies.some((c) => c.value === value);
		if (!found) {
			throw new Error(`invalid currency: ${value}`);
		}

		return value;
	}),
});

export const createCardSchema = z.object({
	cardNumber: z.string().min(4).max(4),
	name: z.string(),
});

export const createTransactionSchema = z.object({
	amount: z.coerce.number().positive().multipleOf(0.01),
	description: z.string().optional(),
	date: z.coerce.date(),
	category: z.string(),
	card: z.string().optional(),
	type: z.union([z.literal('income'), z.literal('expense')]),
	teamId: z.string().optional(),
	dayOfTheMonth: z.coerce.number().positive().max(31).or(z.literal(0)).optional(),
	businessDay: z.coerce.number().positive().max(31).or(z.literal(0)).optional(),
	isRecurring: z.coerce.boolean(),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;

export const createCategorySchema = z.object({
	name: z.string().min(3).max(20),
	icon: z.string().max(20),
	type: z.enum(['income', 'expense']),
});

export type createCategorySchemaType = z.infer<typeof createCategorySchema>;

export const deleteCategorySchema = z.object({
	name: z.string().min(3).max(20),
	type: z.enum(['income', 'expense']),
});

export type deleteCategorySchemaType = z.infer<typeof deleteCategorySchema>;
