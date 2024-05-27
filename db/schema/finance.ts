import { integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';
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
});

export type UserSettingsType = typeof userSettings.$inferSelect;

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

export type CardsType = typeof cards.$inferSelect;

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
	amount: integer('amount'),
	description: text('description'),
	date: integer('date', { mode: 'timestamp_ms' }).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	type: text('type').default('income'),
	cardId: text('cardId').references(() => cards.id, { onDelete: 'set null' }),
	category: text('category'),
	categoryIcon: text('categoryIcon'),
	teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
});

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

export const teams = sqliteTable('team', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	ownerId: text('ownerId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
});

export const teamMembers = sqliteTable('teamMember', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	teamId: text('teamId')
		.notNull()
		.references(() => teams.id, { onDelete: 'cascade' }),
	role: text('role').notNull().default('member'),
	status: text('status').notNull().default('active'),
});

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
