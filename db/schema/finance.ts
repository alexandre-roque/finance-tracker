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
	mainCard: text('mainCard').references(() => cards.id, { onDelete: 'set null' }),
	mainTeam: text('mainTeam').references(() => teams.id, { onDelete: 'set null' }),
});

export type userSettingsType = typeof userSettings.$inferSelect;

export const cards = sqliteTable('card', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name'),
	number: text('number'),
});

export type cardsType = typeof cards.$inferSelect;

export const categories = sqliteTable(
	'category',
	{
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		icon: text('icon').notNull(),
		type: text('type').default('income').notNull(),
		teamId: text('teamId'),
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
	cardId: text('cardId'),
	category: text('category'),
	categoryIcon: text('categoryIcon'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
	installmentId: text('installmentId'),
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
	amount: integer('amount'),
	description: text('description'),
	dayOfTheMonth: integer('dayOfTheMonth'),
	businessDay: integer('businessDay'),
	type: text('type').default('income'),
	cardId: text('cardId').references(() => cards.id, { onDelete: 'set null' }),
	category: text('category'),
	categoryIcon: text('categoryIcon'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
});

export const monthHistories = sqliteTable(
	'monthHistory',
	{
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		day: integer('day'),
		month: integer('month'),
		year: integer('year'),
		income: integer('income'),
		expense: integer('expense'),
		teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.day, table.month, table.year, table.userId] }),
	})
);

export type monthHistoryType = typeof monthHistories.$inferSelect;

export const yearHistories = sqliteTable(
	'yearHistory',
	{
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		month: integer('month'),
		year: integer('year'),
		income: integer('income'),
		expense: integer('expense'),
		teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.month, table.year, table.userId] }),
	})
);

export type yearHistoryType = typeof yearHistories.$inferSelect;

export const teams = sqliteTable('team', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: text('name').notNull(),
	description: text('description'),
	ownerId: text('ownerId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
});

export type teamsType = typeof teams.$inferSelect;

export const teamMembers = sqliteTable('teamMember', {
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
});

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
		pk: primaryKey({ columns: [table.inviterId, table.guestId, table.teamId] }),
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

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id],
	}),
	mainCard: one(cards, {
		fields: [userSettings.mainCard],
		references: [cards.id],
	}),
	mainTeam: one(teams, {
		fields: [userSettings.mainTeam],
		references: [teams.id],
	}),
}));

export const cardRelations = relations(cards, ({ one }) => ({
	user: one(users, {
		fields: [cards.userId],
		references: [users.id],
	}),
}));

export const categoryRelations = relations(categories, ({ one }) => ({
	user: one(users, {
		fields: [categories.userId],
		references: [users.id],
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
	card: one(cards, {
		fields: [transactions.cardId],
		references: [cards.id],
	}),
}));

export const recurringTransactionRelations = relations(recurringTransactions, ({ one }) => ({
	user: one(users, {
		fields: [recurringTransactions.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [recurringTransactions.teamId],
		references: [teams.id],
	}),
	card: one(cards, {
		fields: [recurringTransactions.cardId],
		references: [cards.id],
	}),
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

export const teamRelations = relations(teams, ({ one }) => ({
	owner: one(users, {
		fields: [teams.ownerId],
		references: [users.id],
	}),
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
