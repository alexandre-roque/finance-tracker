'use server';

import moment from 'moment';
import { auth } from '@/auth';
import { db } from '@/db';
import { categories, monthHistories, recurringTransactions, transactions, yearHistories } from '@/db/schema/finance';
import { DateToUTCDate, TransactionType, getBusinessDayOfMonth } from '@/lib/utils';
import {
	createTransactionSchema,
	createTransactionSchemaType,
	editRecurrentTransactionSchema,
	editRecurrentTransactionSchemaType,
	editTransactionSchema,
	editTransactionSchemaType,
} from '@/schemas';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ulid } from 'ulid';

export async function CreateTransaction(form: createTransactionSchemaType) {
	const parsedBody = createTransactionSchema.safeParse(form);

	if (!parsedBody.success) {
		return { error: parsedBody.error.message };
	}

	const session = await auth();
	let userId = parsedBody.data.userId;
	if (!userId) {
		if (!session || !session.user || !session.user.id) {
			redirect('/sign-in');
		}
		userId = session.user.id;
	}

	const {
		amount,
		category,
		date,
		description,
		type,
		teamId,
		isRecurring,
		businessDay,
		dayOfTheMonth,
		bankingAccountId,
		installments,
	} = parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const transactionsToInsert = [];

	if (isRecurring) {
		const [recurringTransaction] = await db
			.insert(recurringTransactions)
			.values({
				userId,
				amount,
				type,
				teamId,
				bankingAccountId,
				dayOfTheMonth: dayOfTheMonth ?? null,
				businessDay: businessDay ?? null,
				description: description || '',
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
				categoryId: category,
			})
			.returning();

		if (recurringTransaction) {
			const d = new Date();
			const dayInMonth = d.getUTCDate();
			const businessDayCount = getBusinessDayOfMonth(d);

			if (dayInMonth === dayOfTheMonth || businessDay === businessDayCount) {
				transactionsToInsert.push({
					userId,
					amount,
					type,
					teamId,
					bankingAccountId,
					date: DateToUTCDate(new Date()),
					description: description || '',
					category: categoryRow.name,
					categoryIcon: categoryRow.icon,
					categoryId: category,
				});
			}
		}

		return;
	}

	let howManyInstallments = !installments ? 1 : installments;
	const installmentId = installments > 1 ? ulid() : null;

	for (let i = 0; i < (howManyInstallments ?? 1); i++) {
		transactionsToInsert.push({
			userId,
			amount: amount / howManyInstallments,
			date: moment(date).add(i, 'months').toDate(),
			type,
			teamId,
			installmentId,
			bankingAccountId,
			description: (description || '') + (howManyInstallments > 1 ? ` (${i + 1}/${howManyInstallments})` : ''),
			category: categoryRow.name,
			categoryIcon: categoryRow.icon,
			categoryId: category,
		});
	}

	for (const transaction of transactionsToInsert) {
		const { date, amount, type, teamId } = transaction;
		try {
			await db.transaction(async (trx) => {
				await trx.insert(transactions).values(transaction);
				await CreateOrUpdateHistories({ trx, date, type, amount, userId, teamId });
			});
		} catch (e) {
			console.error(e);
		}
	}
}

export async function EditRecurrentTransaction(form: editRecurrentTransactionSchemaType) {
	const parsedBody = editRecurrentTransactionSchema.safeParse(form);
	if (!parsedBody.success) {
		return { error: parsedBody.error.message };
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	const { amount, category, description, type, teamId, bankingAccountId, transactionId, businessDay, dayOfTheMonth } =
		parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const transactionsResult = await db.query.recurringTransactions.findFirst({
		where: (recurringTransactions, { eq }) => eq(recurringTransactions.id, transactionId),
	});

	if (!transactionsResult) {
		throw new Error('Bad request');
	}

	await db
		.update(recurringTransactions)
		.set({
			userId,
			amount,
			type,
			businessDay,
			dayOfTheMonth,
			teamId: teamId ?? null,
			bankingAccountId: bankingAccountId ?? null,
			description: description ?? '',
			category: categoryRow.name,
			categoryIcon: categoryRow.icon,
			categoryId: category,
		})
		.where(eq(recurringTransactions.id, transactionId));
}

export async function DeleteTransaction({
	transactionId,
	installmentId,
	isRecurrent,
}: {
	transactionId: string;
	installmentId?: string;
	isRecurrent?: boolean;
}) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	if (isRecurrent) {
		const recurrentTransaction = await db.query.recurringTransactions.findFirst({
			where: (recurringTransactions, { eq, and }) =>
				and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, transactionId)),
		});

		if (recurrentTransaction) {
			await db
				.delete(recurringTransactions)
				.where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, transactionId)));
		}

		return;
	}

	const query = installmentId
		? and(eq(transactions.userId, userId), eq(transactions.installmentId, installmentId))
		: and(eq(transactions.userId, userId), eq(transactions.id, transactionId));
	const transactionsResult = await db.select().from(transactions).where(query);

	if (!transactionsResult?.length) {
		throw new Error('Bad request');
	}

	for (const transaction of transactionsResult) {
		const { date, amount, type, teamId } = transaction;

		await db.transaction(async (trx) => {
			await trx
				.delete(transactions)
				.where(and(eq(transactions.userId, userId), eq(transactions.id, transaction.id)));

			await SubtractFromHistories({ trx, date, type, amount, userId, teamId });
		});
	}
}

export async function EditTransaction(form: editTransactionSchemaType) {
	const parsedBody = editTransactionSchema.safeParse(form);
	if (!parsedBody.success) {
		return { error: parsedBody.error.message };
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

	const { amount, category, date, description, type, teamId, bankingAccountId, transactionId } = parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const transactionsResult = await db.query.transactions.findFirst({
		where: (transactions, { eq }) => eq(transactions.id, transactionId),
	});

	if (!transactionsResult) {
		throw new Error('Bad request');
	}

	const oldAmount = transactionsResult.amount;
	const oldDate = transactionsResult.date;
	const oldTeamId = transactionsResult.teamId;

	await db.transaction(async (trx) => {
		await trx
			.update(transactions)
			.set({
				userId,
				amount,
				date,
				type,
				teamId: teamId ?? null,
				bankingAccountId: bankingAccountId ?? null,
				description: description ?? '',
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
				categoryId: category,
			})
			.where(eq(transactions.id, transactionId));

		if (oldAmount !== amount || !moment(date).isSame(oldDate) || oldTeamId !== teamId) {
			await SubtractFromHistories({ trx, date: oldDate, type, amount: oldAmount, userId, teamId: oldTeamId });
			await CreateOrUpdateHistories({ trx, date, type, amount, userId, teamId });
		}
	});
}

async function SubtractFromHistories({ trx, date, type, amount, userId, teamId }: any) {
	// Atualiza monthHistory
	const [existingMonthHistory] = await trx
		.select()
		.from(monthHistories)
		.where(
			and(
				teamId ? eq(monthHistories.teamId, teamId) : eq(monthHistories.userId, userId),
				eq(monthHistories.day, date.getUTCDate()),
				eq(monthHistories.month, date.getUTCMonth()),
				eq(monthHistories.year, date.getUTCFullYear())
			)
		);

	if (existingMonthHistory) {
		await trx
			.update(monthHistories)
			.set({
				expense: (existingMonthHistory.expense ?? 0) - (type === 'expense' ? amount : 0),
				income: (existingMonthHistory.income ?? 0) - (type === 'income' ? amount : 0),
			})
			.where(eq(monthHistories.id, existingMonthHistory.id));
	}

	// Atualiza yearHistory
	const [existingYearHistory] = await trx
		.select()
		.from(yearHistories)
		.where(
			and(
				teamId ? eq(yearHistories.teamId, teamId) : eq(yearHistories.userId, userId),
				eq(yearHistories.month, date.getUTCMonth()),
				eq(yearHistories.year, date.getUTCFullYear())
			)
		);

	if (existingYearHistory) {
		await trx
			.update(yearHistories)
			.set({
				expense: (existingYearHistory.expense ?? 0) - (type === 'expense' ? amount : 0),
				income: (existingYearHistory.income ?? 0) - (type === 'income' ? amount : 0),
			})
			.where(eq(yearHistories.id, existingYearHistory.id));
	}
}

async function CreateOrUpdateHistories({
	trx,
	date,
	type,
	amount,
	userId,
	teamId,
}: {
	trx: any;
	date: Date;
	type: TransactionType;
	amount: number;
	userId: string;
	teamId?: string;
}) {
	// Atualiza monthHistory
	const [existingMonthHistory] = await trx
		.select()
		.from(monthHistories)
		.where(
			and(
				teamId ? eq(monthHistories.teamId, teamId) : eq(monthHistories.userId, userId),
				eq(monthHistories.day, date.getUTCDate()),
				eq(monthHistories.month, date.getUTCMonth()),
				eq(monthHistories.year, date.getUTCFullYear())
			)
		);

	if (existingMonthHistory) {
		await trx
			.update(monthHistories)
			.set({
				expense: (existingMonthHistory.expense ?? 0) + (type === 'expense' ? amount : 0),
				income: (existingMonthHistory.income ?? 0) + (type === 'income' ? amount : 0),
			})
			.where(eq(monthHistories.id, existingMonthHistory.id));
	} else {
		await trx.insert(monthHistories).values({
			userId: teamId ? null : userId,
			teamId: teamId || null,
			day: date.getUTCDate(),
			month: date.getUTCMonth(),
			year: date.getUTCFullYear(),
			expense: type === 'expense' ? amount : 0,
			income: type === 'income' ? amount : 0,
		});
	}

	// Atualiza yearHistory
	const [existingYearHistory] = await trx
		.select()
		.from(yearHistories)
		.where(
			and(
				teamId ? eq(yearHistories.teamId, teamId) : eq(yearHistories.userId, userId),
				eq(yearHistories.month, date.getUTCMonth()),
				eq(yearHistories.year, date.getUTCFullYear())
			)
		);

	if (existingYearHistory) {
		await trx
			.update(yearHistories)
			.set({
				expense: (existingYearHistory.expense ?? 0) + (type === 'expense' ? amount : 0),
				income: (existingYearHistory.income ?? 0) + (type === 'income' ? amount : 0),
			})
			.where(eq(yearHistories.id, existingYearHistory.id));
	} else {
		await trx.insert(yearHistories).values({
			userId: teamId ? null : userId,
			teamId: teamId || null,
			month: date.getUTCMonth(),
			year: date.getUTCFullYear(),
			expense: type === 'expense' ? amount : 0,
			income: type === 'income' ? amount : 0,
		});
	}
}
