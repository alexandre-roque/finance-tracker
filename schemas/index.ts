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
