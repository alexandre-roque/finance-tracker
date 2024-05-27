'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, monthHistories, recurringTransactions, transactions, yearHistories } from '@/db/schema/finance';
import { DateToUTCDate, getBusinessDayOfMonth } from '@/lib/utils';
import { createTransactionSchema, createTransactionSchemaType } from '@/schemas';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function CreateTransaction(form: createTransactionSchemaType) {
	const parsedBody = createTransactionSchema.safeParse(form);
	if (!parsedBody.success) {
		throw new Error(parsedBody.error.message);
	}

	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;

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
		card: cardId,
	} = parsedBody.data;
	const [categoryRow] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.userId, session.user.id), eq(categories.name, category)));

	if (!categoryRow) {
		throw new Error('category not found');
	}

	await db.transaction(async (trx) => {
		if (isRecurring) {
			const [recurringTransaction] = await trx
				.insert(recurringTransactions)
				.values({
					userId,
					amount,
					type,
					teamId,
					cardId,
					dayOfTheMonth: dayOfTheMonth ?? null,
					businessDay: businessDay ?? null,
					description: description || '',
					category: categoryRow.name,
					categoryIcon: categoryRow.icon,
				})
				.returning();

			if (recurringTransaction) {
				const d = new Date();
				const dayInMonth = d.getUTCDate();
				const businessDayCount = getBusinessDayOfMonth(d);

				if (dayInMonth === dayOfTheMonth || businessDay === businessDayCount) {
					await trx.insert(transactions).values({
						userId,
						amount,
						type,
						teamId,
						cardId,
						date: DateToUTCDate(new Date()),
						description: description || '',
						category: categoryRow.name,
						categoryIcon: categoryRow.icon,
					});

					// Atualiza monthHistory
					const [existingMonthHistory] = await trx
						.select()
						.from(monthHistories)
						.where(
							and(
								eq(monthHistories.userId, userId),
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
							.where(
								and(
									eq(monthHistories.userId, userId),
									eq(monthHistories.day, date.getUTCDate()),
									eq(monthHistories.month, date.getUTCMonth()),
									eq(monthHistories.year, date.getUTCFullYear())
								)
							);
					} else {
						await trx.insert(monthHistories).values({
							userId,
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
								eq(yearHistories.userId, userId),
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
							.where(
								and(
									eq(yearHistories.userId, userId),
									eq(yearHistories.month, date.getUTCMonth()),
									eq(yearHistories.year, date.getUTCFullYear())
								)
							);
					} else {
						await trx.insert(yearHistories).values({
							userId,
							month: date.getUTCMonth(),
							year: date.getUTCFullYear(),
							expense: type === 'expense' ? amount : 0,
							income: type === 'income' ? amount : 0,
						});
					}
				}
			}

			return;
		}

		await trx.insert(transactions).values({
			userId,
			amount,
			date,
			type,
			teamId,
			cardId,
			description: description || '',
			category: categoryRow.name,
			categoryIcon: categoryRow.icon,
		});

		// Atualiza monthHistory
		const [existingMonthHistory] = await trx
			.select()
			.from(monthHistories)
			.where(
				and(
					eq(monthHistories.userId, userId),
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
				.where(
					and(
						eq(monthHistories.userId, userId),
						eq(monthHistories.day, date.getUTCDate()),
						eq(monthHistories.month, date.getUTCMonth()),
						eq(monthHistories.year, date.getUTCFullYear())
					)
				);
		} else {
			await trx.insert(monthHistories).values({
				userId,
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
					eq(yearHistories.userId, userId),
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
				.where(
					and(
						eq(yearHistories.userId, userId),
						eq(yearHistories.month, date.getUTCMonth()),
						eq(yearHistories.year, date.getUTCFullYear())
					)
				);
		} else {
			await trx.insert(yearHistories).values({
				userId,
				month: date.getUTCMonth(),
				year: date.getUTCFullYear(),
				expense: type === 'expense' ? amount : 0,
				income: type === 'income' ? amount : 0,
			});
		}
	});
}
