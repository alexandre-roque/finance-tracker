import { z } from 'zod';
export const authFormSchema = (type: string) =>
	z.object({
		// sign up
		name: type === 'sign-in' ? z.string().optional() : z.string().min(3),
		// both
		email: z.string().email(),
		password: z.string().min(8),
	});
