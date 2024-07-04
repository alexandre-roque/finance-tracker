import { integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { relations, sql } from 'drizzle-orm';
import { ulid } from 'ulid';

export const userSettings = sqliteTable('userSetting', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	currency: text('currency'),
	mainIncomeCategory: text('mainIncomeCategory'),
	mainExpenseCategory: text('mainExpenseCategory'),
	mainBankingAccount: text('mainBankingAccount').references(() => bankingAccounts.id, { onDelete: 'set null' }),
	mainTeam: text('mainTeam').references(() => teams.id, { onDelete: 'set null' }),
	disableAnimations: integer('disableAnimation', { mode: 'boolean' }).default(false),
});

export type userSettingsType = typeof userSettings.$inferSelect;

export const bankingAccounts = sqliteTable('bankingAccount', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name'),
	description: text('description'),
	payDay: integer('payDay').default(10).notNull(),
	closeDay: integer('closeDay').default(3).notNull(),
	balance: integer('balance').default(0).notNull(),
	automaticDebitInvoices: integer('automaticDebitInvoices', { mode: 'boolean' }).default(false),
	hideInBalance: integer('hideInBalance', { mode: 'boolean' }).default(false),
});

export type bankingAccountsType = typeof bankingAccounts.$inferSelect;

export const creditCardInvoices = sqliteTable('creditCardInvoice', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	bankingAccountId: text('bankingAccountId')
		.notNull()
		.references(() => bankingAccounts.id, { onDelete: 'cascade' }),
	month: integer('month').notNull(),
	year: integer('year').notNull(),
	paymentDate: integer('paymentDate', { mode: 'timestamp_ms' }),
	isPaid: integer('isPaid', { mode: 'boolean' }).default(false),
	amount: integer('amount').notNull(),
});

export type creditCardInvoicesType = typeof creditCardInvoices.$inferSelect;

export const categories = sqliteTable(
	'category',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => ulid()),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		icon: text('icon').notNull(),
		type: text('type').default('income').notNull(),
		sharable: integer('sharable', { mode: 'boolean' }),
	},
	(table) => ({
		unq: unique().on(table.name, table.userId, table.type),
	})
);

export type categoriesType = typeof categories.$inferSelect;

export const transactions = sqliteTable('transaction', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	amount: integer('amount').notNull(),
	description: text('description'),
	date: integer('date', { mode: 'timestamp_ms' })
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
		.notNull(),
	type: text('type').default('income').notNull(),
	paymentType: text('paymentType').default('credit').notNull(),
	bankingAccountId: text('bankingAccountId'),
	category: text('category'),
	categoryIcon: text('categoryIcon'),
	categoryId: text('categoryId'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
	installmentId: text('installmentId'),
	isPaid: integer('isPaid', { mode: 'boolean' }).default(true),
	recurrenceId: text('recurrenceId').references(() => recurringTransactions.id, { onDelete: 'set null' }),
});

export type transactionsType = typeof transactions.$inferSelect;

export const recurringTransactions = sqliteTable('recurringTransaction', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	amount: integer('amount').notNull(),
	description: text('description'),
	dayOfTheMonth: integer('dayOfTheMonth'),
	businessDay: integer('businessDay'),
	type: text('type').default('income').notNull(),
	bankingAccountId: text('bankingAccountId'),
	paymentType: text('paymentType').default('credit').notNull(),
	category: text('category'),
	categoryIcon: text('categoryIcon'),
	categoryId: text('categoryId'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
});

export type recurringTransactionsType = typeof recurringTransactions.$inferSelect;

export const monthHistories = sqliteTable('monthHistory', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
	day: integer('day'),
	month: integer('month'),
	year: integer('year'),
	income: integer('income'),
	expense: integer('expense'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
});

export type monthHistoryType = typeof monthHistories.$inferSelect;

export const yearHistories = sqliteTable('yearHistory', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
	month: integer('month'),
	year: integer('year'),
	income: integer('income'),
	expense: integer('expense'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
});

export type yearHistoryType = typeof yearHistories.$inferSelect;

export const teams = sqliteTable('team', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: text('name').notNull(),
	description: text('description'),
	splitType: text('splitType').default('percentage').notNull(),
	hideOnLandingPage: integer('hideOnLandingPage', { mode: 'boolean' }).default(false),
	ownerId: text('ownerId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
});

export type teamsType = typeof teams.$inferSelect;

export const teamMembers = sqliteTable(
	'teamMember',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => ulid()),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		teamId: text('teamId')
			.notNull()
			.references(() => teams.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('member'),
		status: text('status').notNull().default('active'),
		percentage: integer('percentage'),
	},
	(table) => ({
		unq: unique().on(table.userId, table.teamId),
	})
);

export type teamMembersType = typeof teamMembers.$inferSelect;

export const pendingTeamAprovals = sqliteTable(
	'pendingTeamAproval',
	{
		inviterId: text('inviterId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		guestId: text('guestId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		teamId: text('teamId')
			.notNull()
			.references(() => teams.id, { onDelete: 'cascade' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.guestId, table.teamId] }),
	})
);

export type pendingTeamAprovalsType = typeof pendingTeamAprovals.$inferSelect;

export const dailyRecurrenceCheckers = sqliteTable(
	'dailyRecurrenceChecker',
	{
		day: integer('day'),
		month: integer('month'),
		year: integer('year'),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.day, table.month, table.year] }),
	})
);

export type dailyRecurrenceCheckersType = typeof dailyRecurrenceCheckers.$inferSelect;

export const dailyDebitCheckers = sqliteTable(
	'dailyDebitChecker',
	{
		day: integer('day'),
		month: integer('month'),
		year: integer('year'),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.day, table.month, table.year] }),
	})
);

export type dailyDebitCheckersType = typeof dailyDebitCheckers.$inferSelect;

export const inviteTokens = sqliteTable('inviteToken', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	teamId: text('teamId')
		.notNull()
		.references(() => teams.id, { onDelete: 'cascade' }),
	token: text('token').unique().notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp_ms' })
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
		.notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
	transactions: many(transactions),
	teams: many(teamMembers),
	ownedTeams: many(teams),
}));

export const userSettingsRelations = relations(userSettings, ({ one, many }) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id],
	}),
	mainBankingAccount: one(bankingAccounts, {
		fields: [userSettings.mainBankingAccount],
		references: [bankingAccounts.id],
	}),
	mainTeam: one(teams, {
		fields: [userSettings.mainTeam],
		references: [teams.id],
	}),
}));

export const bankingAccountRelations = relations(bankingAccounts, ({ one, many }) => ({
	user: one(users, {
		fields: [bankingAccounts.userId],
		references: [users.id],
	}),
	creditCardInvoices: many(creditCardInvoices),
}));

export const creditCardInvoiceRelations = relations(creditCardInvoices, ({ one }) => ({
	user: one(users, {
		fields: [creditCardInvoices.userId],
		references: [users.id],
	}),
	bankingAccount: one(bankingAccounts, {
		fields: [creditCardInvoices.bankingAccountId],
		references: [bankingAccounts.id],
	}),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [transactions.teamId],
		references: [teams.id],
	}),
	bankingAccount: one(bankingAccounts, {
		fields: [transactions.bankingAccountId],
		references: [bankingAccounts.id],
	}),
	recurringTransaction: one(recurringTransactions, {
		fields: [transactions.recurrenceId],
		references: [recurringTransactions.id],
	}),
}));

export const recurringTransactionRelations = relations(recurringTransactions, ({ one, many }) => ({
	user: one(users, {
		fields: [recurringTransactions.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [recurringTransactions.teamId],
		references: [teams.id],
	}),
	bankingAccount: one(bankingAccounts, {
		fields: [recurringTransactions.bankingAccountId],
		references: [bankingAccounts.id],
	}),
	transactions: many(transactions)
}));

export const monthHistoryRelations = relations(monthHistories, ({ one }) => ({
	user: one(users, {
		fields: [monthHistories.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [monthHistories.teamId],
		references: [teams.id],
	}),
}));

export const yearHistoryRelations = relations(yearHistories, ({ one }) => ({
	user: one(users, {
		fields: [yearHistories.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [yearHistories.teamId],
		references: [teams.id],
	}),
}));

export const teamRelations = relations(teams, ({ one, many }) => ({
	owner: one(users, {
		fields: [teams.ownerId],
		references: [users.id],
	}),
	members: many(teamMembers),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
}));

export const pendingTeamApprovalRelations = relations(pendingTeamAprovals, ({ one }) => ({
	inviter: one(users, {
		fields: [pendingTeamAprovals.inviterId],
		references: [users.id],
	}),
	guest: one(users, {
		fields: [pendingTeamAprovals.guestId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [pendingTeamAprovals.teamId],
		references: [teams.id],
	}),
}));
