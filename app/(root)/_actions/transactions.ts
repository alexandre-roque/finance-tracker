'use server';

import moment from 'moment';
import { auth } from '@/auth';
import { db } from '@/db';
import {
	bankingAccounts,
	categories,
	creditCardInvoices,
	monthHistories,
	recurringTransactions,
	transactions,
	transactionsType,
	yearHistories,
} from '@/db/schema/finance';
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
import { getDaysInMonth } from 'date-fns';

type DBTransactionType = Parameters<typeof db.transaction>[0] extends (trx: infer T) => Promise<any> ? T : never;

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
		paymentType,
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
				paymentType: paymentType,
			})
			.returning();

		if (recurringTransaction) {
			const newDate = new Date();
			const dayInMonth = newDate.getUTCDate();
			const businessDayCount = getBusinessDayOfMonth(newDate);

			let d;
			if (dayOfTheMonth) {
				d = new Date(
					newDate.getUTCFullYear(),
					newDate.getUTCMonth(),
					dayOfTheMonth
				);
			} else if (businessDay) {
				const daysInMonth = getDaysInMonth(newDate);
				for (let i = 1; i <= daysInMonth; i++) {
					if (i === businessDay) {
						d = new Date(
							newDate.getUTCFullYear(),
							newDate.getUTCMonth(),
							i
						);

						break;
					}
				}
			}

			const obj = {
				userId,
				amount,
				type,
				teamId,
				bankingAccountId,
				description: description || '',
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
				categoryId: category,
				paymentType: paymentType,
				date: DateToUTCDate(d || newDate),
			};

			transactionsToInsert.push(obj);

			if (dayInMonth === dayOfTheMonth || businessDay === businessDayCount) {
				transactionsToInsert.push({
					...obj,
					date: moment(obj.date).add(1, 'months').toDate(),
				});
			}
		}
	} else {
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
				description:
					(description || '') + (howManyInstallments > 1 ? ` (${i + 1}/${howManyInstallments})` : ''),
				category: categoryRow.name,
				categoryIcon: categoryRow.icon,
				categoryId: category,
				paymentType: paymentType,
			});
		}
	}

	for (const transaction of transactionsToInsert) {
		try {
			await db.transaction(async (trx) => {
				await trx.insert(transactions).values(transaction);
				await CreateOrUpdateHistories(trx, transaction);
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
		await db.transaction(async (trx) => {
			await trx
				.delete(transactions)
				.where(and(eq(transactions.userId, userId), eq(transactions.id, transaction.id)));

			await SubtractFromHistories(trx, transaction);
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

	const { amount, category, date, description, type, teamId, bankingAccountId, transactionId, paymentType } = parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const oldTransaction = await db.query.transactions.findFirst({
		where: (transactions, { eq }) => eq(transactions.id, transactionId),
	});

	if (!oldTransaction) {
		throw new Error('Bad request');
	}

	const oldAmount = oldTransaction.amount;
	const oldDate = oldTransaction.date;
	const oldTeamId = oldTransaction.teamId;

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
			await SubtractFromHistories(trx, oldTransaction);
			await CreateOrUpdateHistories(trx, { date, type, amount, userId, teamId, bankingAccountId, paymentType });
		}
	});
}

async function SubtractFromHistories(
	trx: DBTransactionType,
	{
		date,
		type,
		amount,
		userId,
		teamId,
		bankingAccountId,
		paymentType,
	}: Partial<transactionsType> & { date: Date; userId: string; type: string; amount: number }
) {
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

	if (bankingAccountId) {
		const previousMonthDate = moment(date).subtract(1, 'month').toDate();

		const existingBankingAccount = await trx.query.bankingAccounts.findFirst({
			where: (bankingAccounts, { eq }) => eq(bankingAccounts.id, bankingAccountId),
			with: {
				creditCardInvoices: {
					where: (creditCardInvoices, { eq, and, or }) =>
						or(
							and(
								eq(creditCardInvoices.month, date.getUTCMonth()),
								eq(creditCardInvoices.year, date.getUTCFullYear())
							),
							and(
								eq(creditCardInvoices.month, previousMonthDate.getUTCMonth()),
								eq(creditCardInvoices.year, previousMonthDate.getUTCFullYear())
							)
						),
				},
			},
		});

		if (existingBankingAccount) {
			if (paymentType === 'debit' || type === 'income') {
				await trx
					.update(bankingAccounts)
					.set({
						balance: (existingBankingAccount.balance ?? 0) + (type === 'expense' ? -amount : amount),
					})
					.where(eq(bankingAccounts.id, bankingAccountId));
			} else if (paymentType === 'credit') {
				const correctDate = date.getUTCDate() < existingBankingAccount.closeDay ? previousMonthDate : date;
				const creditCardInvoice = existingBankingAccount.creditCardInvoices.find((invoice) => {
					return invoice.month === correctDate.getUTCMonth();
				});

				if (creditCardInvoice) {
					await trx
						.update(creditCardInvoices)
						.set({
							amount: (creditCardInvoice.amount ?? 0) + (type === 'expense' ? -amount : amount),
						})
						.where(eq(creditCardInvoices.id, creditCardInvoice.id));
				}
			}
		}
	}
}

async function CreateOrUpdateHistories(
	trx: DBTransactionType,
	{
		date,
		type,
		amount,
		userId,
		teamId,
		paymentType,
		bankingAccountId,
	}: Partial<transactionsType> & { date: Date; userId: string; type: string; amount: number }
) {
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

	if (bankingAccountId) {
		const previousMonthDate = moment(date).subtract(1, 'month').toDate();

		const existingBankingAccount = await trx.query.bankingAccounts.findFirst({
			where: (bankingAccounts, { eq }) => eq(bankingAccounts.id, bankingAccountId),
			with: {
				creditCardInvoices: {
					where: (creditCardInvoices, { eq, and, or }) =>
						or(
							and(
								eq(creditCardInvoices.month, date.getUTCMonth()),
								eq(creditCardInvoices.year, date.getUTCFullYear())
							),
							and(
								eq(creditCardInvoices.month, previousMonthDate.getUTCMonth()),
								eq(creditCardInvoices.year, previousMonthDate.getUTCFullYear())
							)
						),
				},
			},
		});

		if (existingBankingAccount) {
			if (paymentType === 'debit' || type === 'income') {
				await trx
					.update(bankingAccounts)
					.set({
						balance: (existingBankingAccount.balance ?? 0) + (type === 'expense' ? -amount : amount),
					})
					.where(eq(bankingAccounts.id, bankingAccountId));
			} else if (paymentType === 'credit') {
				const correctDate = date.getUTCDate() < existingBankingAccount.closeDay ? previousMonthDate : date;
				
				const creditCardInvoice = existingBankingAccount.creditCardInvoices.find((invoice) => {
					return invoice.month === correctDate.getUTCMonth();
				});

				if (creditCardInvoice) {
					await trx
						.update(creditCardInvoices)
						.set({
							amount: (creditCardInvoice.amount ?? 0) + (type === 'expense' ? amount : -amount),
							isPaid: false,
							paymentDate: null,
						})
						.where(eq(creditCardInvoices.id, creditCardInvoice.id));
				} else {
					await trx.insert(creditCardInvoices).values({
						userId: userId,
						month: correctDate.getUTCMonth(),
						year: correctDate.getUTCFullYear(),
						amount: type === 'expense' ? amount : -amount,
						bankingAccountId,
					});
				}
			}
		}
	}
}

export async function PayInvoice({ invoiceId }: { invoiceId: string }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const userId = session.user.id;
	const invoice = await db.query.creditCardInvoices.findFirst({
		where: (creditCardInvoices, { eq, and }) =>
			and(eq(creditCardInvoices.id, invoiceId), eq(creditCardInvoices.userId, userId)),
	});

	if (!invoice) {
		return { error: 'Fatura não encontrada' };
	}

	if (invoice.isPaid) {
		return { error: 'Fatura já paga' };
	}

	const bankingAccount = await db.query.bankingAccounts.findFirst({
		where: (bankingAccounts, { eq }) => eq(bankingAccounts.id, invoice.bankingAccountId),
	});

	if (!bankingAccount) {
		return { error: 'Conta bancária não encontrada' };
	}

	await db.transaction(async (trx) => {
		await trx
			.update(creditCardInvoices)
			.set({
				isPaid: true,
				paymentDate: new Date(),
			})
			.where(eq(creditCardInvoices.id, invoiceId));

		await trx
			.update(bankingAccounts)
			.set({
				balance: (bankingAccount.balance ?? 0) - invoice.amount,
			})
			.where(eq(bankingAccounts.id, invoice.bankingAccountId));
	});

	return { success: true };
}
