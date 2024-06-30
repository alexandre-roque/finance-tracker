import { z } from 'zod';
import { Currencies } from '@/lib/currencies';
import { differenceInDays } from 'date-fns';
import { MAX_DATE_RANGE_DAYS } from '@/constants';

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

export const createBankingAccountSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	closeDay: z.coerce.number().gte(0).max(31),
	payDay: z.coerce.number().gte(0).max(31),
	balance: z.coerce.number().gte(0).default(0),
	bankingAccountId: z.string().optional(),
});

export type createBankingAccountSchemaType = z.infer<typeof createBankingAccountSchema>;

export const possiblePaymentTypesArray = ['credit', 'debit'] as const;
export type PossiblePaymentTypes = (typeof possiblePaymentTypesArray)[number];

export const createTransactionSchema = z.object({
	amount: z.coerce.number().positive().multipleOf(0.01),
	description: z.string().optional(),
	date: z.coerce.date(),
	category: z.string(),
	bankingAccountId: z.string(),
	type: z.union([z.literal('income'), z.literal('expense')]),
	teamId: z.string().optional(),
	paymentType: z.enum(possiblePaymentTypesArray).optional(),
	installments: z.coerce.number().default(1),
	dayOfTheMonth: z.coerce.number().gte(0).max(31).or(z.literal(0)).optional(),
	businessDay: z.coerce.number().gte(0).max(31).or(z.literal(0)).optional(),
	isRecurring: z.coerce.boolean(),
	userId: z.string().optional(),
});

export type createTransactionSchemaType = z.infer<typeof createTransactionSchema>;

export const createTransactionsSchema = z.object({
	transactions: z.array(createTransactionSchema),
});
export type createTransactionsSchemaType = z.infer<typeof createTransactionsSchema>;

export const createCategorySchema = z.object({
	name: z.string().min(3).max(20),
	icon: z.string().max(20),
	type: z.enum(['income', 'expense']),
	sharable: z.boolean().default(false),
});

export type createCategorySchemaType = z.infer<typeof createCategorySchema>;

export const deleteCategorySchema = z.object({
	name: z.string().min(3).max(20),
	type: z.enum(['income', 'expense']),
});

export type deleteCategorySchemaType = z.infer<typeof deleteCategorySchema>;

export const editCategorySchema = z.object({
	name: z.string().min(3).max(20),
	icon: z.string().max(20),
	type: z.enum(['income', 'expense']),
	sharable: z.boolean().default(false),
	id: z.string(),
});

export type editCategorySchemaType = z.infer<typeof editCategorySchema>;

export const OverviewQuerySchema = z
	.object({
		from: z.coerce.date(),
		to: z.coerce.date(),
	})
	.refine((args) => {
		const { from, to } = args;
		const days = differenceInDays(to, from);

		const isValidRange = days >= 0 && days <= MAX_DATE_RANGE_DAYS;
		return isValidRange;
	});

export const createTeamSchema = z.object({
	name: z.string().min(3).max(20),
	description: z.string().max(40),
});

export type createTeamSchemaType = z.infer<typeof createTeamSchema>;

export const inviteToTeamSchema = z.object({
	email: z.string().email(),
	teamId: z.string(),
});

export type inviteToTeamSchemaType = z.infer<typeof inviteToTeamSchema>;

export const editTransactionSchema = z.object({
	transactionId: z.string(),
	amount: z.coerce.number().positive().multipleOf(0.01),
	description: z.string().optional(),
	date: z.coerce.date(),
	category: z.string(),
	bankingAccountId: z.string(),
	type: z.union([z.literal('income'), z.literal('expense')]),
	teamId: z.string().optional(),
	paymentType: z.enum(possiblePaymentTypesArray).optional(),
});

export type editTransactionSchemaType = z.infer<typeof editTransactionSchema>;

export const editRecurrentTransactionSchema = z.object({
	transactionId: z.string(),
	amount: z.coerce.number().positive().multipleOf(0.01),
	description: z.string().optional(),
	category: z.string(),
	bankingAccountId: z.string(),
	type: z.union([z.literal('income'), z.literal('expense')]),
	teamId: z.string().optional(),
	dayOfTheMonth: z.coerce.number().gte(0).max(31).or(z.literal(0)).optional(),
	businessDay: z.coerce.number().gte(0).max(31).or(z.literal(0)).optional(),
});

export type editRecurrentTransactionSchemaType = z.infer<typeof editRecurrentTransactionSchema>;

export const possibleRolesArray = ['owner', 'member', 'manager'] as const;
export type PossibleRoles = (typeof possibleRolesArray)[number];

export const possibleStatusArray = ['active', 'inactive', 'pending', 'blocked'] as const;
export type PossibleStatus = (typeof possibleStatusArray)[number];

export const editTeamMemberSchema = z.object({
	role: z.enum(possibleRolesArray),
	status: z.enum(possibleStatusArray),
	teamMemberId: z.string(),
});

export type editTeamMemberSchemaType = z.infer<typeof editTeamMemberSchema>;

export const possibleSplitTypesArray = ['percentage', 'none'] as const;
export type PossibleSplitTypes = (typeof possibleSplitTypesArray)[number];

const memberSchema = z.object({
	id: z.string(),
	percentage: z.coerce
		.number()
		.min(0, { message: 'Percentage must be at least 0' })
		.max(100, { message: 'Percentage must be at most 100' }),
});

export const editTeamSchema = z.object({
	name: z.string().min(3).max(20),
	description: z.string().max(40),
	splitType: z.enum(possibleSplitTypesArray),
	members: z.array(memberSchema),
	teamId: z.string(),
});

export type editTeamSchemaType = z.infer<typeof editTeamSchema>;
