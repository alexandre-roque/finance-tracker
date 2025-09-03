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
import {
	DateToUTCDate,
	TransactionType,
	getBusinessDayOfMonth,
	getLastBusinessDayOfTheMonth,
	isWeekday,
} from '@/lib/utils';
import {
	createTransactionSchema,
	createTransactionSchemaType,
	createTransactionsSchema,
	createTransactionsSchemaType,
	editRecurrentTransactionSchema,
	editRecurrentTransactionSchemaType,
	editTransactionSchema,
	editTransactionSchemaType,
} from '@/schemas';
import { and, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ulid } from 'ulid';
import { getDaysInMonth, startOfDay } from 'date-fns';
import { revalidatePath } from 'next/cache';

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
		recurrenceId,
		isLastBusinessDay,
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
				isLastBusinessDay,
			})
			.returning();

		if (recurringTransaction) {
			const newDate = new Date();
			const nextMonth = moment(date).add(1, 'months').toDate();

			const dayInMonth = newDate.getUTCDate();

			const businessDayCount = getBusinessDayOfMonth(newDate);

			const daysInMonthOfNextMonth = getDaysInMonth(nextMonth);
			const daysInMonth = getDaysInMonth(newDate);

			const lastBusinessDay = getLastBusinessDayOfTheMonth(newDate);
			const lastBusinessDayOfNextMonth = getLastBusinessDayOfTheMonth(nextMonth);

			let d;
			if (dayOfTheMonth) {
				d = new Date(newDate.getUTCFullYear(), newDate.getUTCMonth(), dayOfTheMonth);

				if ((moment(d).isBefore(moment(newDate)), 'day')) {
					d = new Date(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), dayOfTheMonth);
				}
			} else if (businessDay) {
				for (let i = 1; i <= daysInMonth; i++) {
					if (i === businessDay) {
						d = new Date(newDate.getUTCFullYear(), newDate.getUTCMonth(), i);
						break;
					}
				}

				if (moment(d).isBefore(moment(newDate), 'day')) {
					for (let i = 1; i <= daysInMonthOfNextMonth; i++) {
						if (i === businessDay) {
							d = new Date(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), i);
							break;
						}
					}
				}
			} else if (isLastBusinessDay) {
				d = lastBusinessDay;
				if (moment(d).isBefore(moment(newDate), 'day')) {
					d = lastBusinessDayOfNextMonth;
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
				isPaid: true,
				recurrenceId: recurringTransaction.id,
				isToday: false,
			};

			transactionsToInsert.push(obj);

			if (
				dayInMonth === dayOfTheMonth ||
				businessDay === businessDayCount ||
				(isLastBusinessDay && lastBusinessDay.getUTCDate() === dayInMonth)
			) {
				transactionsToInsert.push({
					...obj,
					date,
					isToday: true,
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
				isPaid: true,
				recurrenceId,
				isToday: false,
			});
		}
	}

	for (const transaction of transactionsToInsert) {
		try {
			if (
				moment().isBefore(moment.utc(transaction.date), 'day') &&
				(transaction.type === 'income' ||
					transaction.paymentType === 'debit' ||
					(transaction.recurrenceId && !transaction.isToday))
			) {
				transaction.isPaid = false;
			}

			await db.transaction(async (trx) => {
				await trx.insert(transactions).values(transaction);
				await CreateOrUpdateHistories(trx, transaction);
				await CreateOrUpdateInvoices(trx, transaction);
			});
		} catch (e) {
			console.error(e);
		}
	}
}

export async function CreateTransactionsInBatch(form: createTransactionsSchemaType) {
	// Passo 1: Validar o corpo inteiro da requisição que contém o array
	const parsedBody = createTransactionsSchema.safeParse(form);
	if (!parsedBody.success) {
		return { error: 'Dados inválidos.' };
	}

	// Passo 2: Autenticação - Feita uma única vez para o lote inteiro
	const session = await auth();
	if (!session?.user?.id) {
		redirect('/sign-in');
	}
	const userId = session.user.id;
	const allTransactionsData = parsedBody.data.transactions;

	// Passo 3: Otimização - Coletar todos os IDs de categoria necessários
	// Isso evita fazer uma consulta ao banco de dados para cada transação dentro do loop (problema N+1)
	const categoryIds = Array.from(new Set(allTransactionsData.map((t) => t.category)));
	const categoryRows = await db.select().from(categories).where(inArray(categories.id, categoryIds));

	// Criamos um "mapa" para acesso rápido às informações da categoria dentro do loop
	const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));

	// --- Ponto Crítico: Iniciar a Transação de Banco de Dados ---
	// Tudo aqui dentro ou funciona por completo, ou falha por completo (rollback).
	try {
		await db.transaction(async (trx) => {
			// Loop principal: processar cada transação enviada pelo formulário
			for (const transactionData of allTransactionsData) {
				// Pega a categoria do nosso mapa pré-buscado. Se não existir, falha a transação inteira.
				const categoryRow = categoryMap.get(transactionData.category);
				if (!categoryRow) {
					// Lançar um erro aqui fará com que o db.transaction realize o rollback
					throw new Error(`Categoria com ID ${transactionData.category} não encontrada.`);
				}

				// Extrai os dados da transação atual
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
					recurrenceId,
					isLastBusinessDay,
				} = transactionData;

				// Array para guardar as transações que serão de fato inseridas (ex: parcelas)
				const transactionsToInsert = [];

				// Reutilizamos a sua lógica de negócio original, mas agora dentro do loop
				if (isRecurring) {
					// Sua lógica de recorrência complexa vai aqui...
					// IMPORTANTE: Todas as chamadas ao DB devem usar 'trx' em vez de 'db'
					const [recurringTransaction] = await trx
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
							isLastBusinessDay,
						})
						.returning();

					if (recurringTransaction) {
						const newDate = new Date();
						const nextMonth = moment(date).add(1, 'months').toDate();

						const dayInMonth = newDate.getUTCDate();

						const businessDayCount = getBusinessDayOfMonth(newDate);

						const daysInMonthOfNextMonth = getDaysInMonth(nextMonth);
						const daysInMonth = getDaysInMonth(newDate);

						const lastBusinessDay = getLastBusinessDayOfTheMonth(newDate);
						const lastBusinessDayOfNextMonth = getLastBusinessDayOfTheMonth(nextMonth);

						let d;
						if (dayOfTheMonth) {
							d = new Date(newDate.getUTCFullYear(), newDate.getUTCMonth(), dayOfTheMonth);

							if ((moment(d).isBefore(moment(newDate)), 'day')) {
								d = new Date(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), dayOfTheMonth);
							}
						} else if (businessDay) {
							for (let i = 1; i <= daysInMonth; i++) {
								if (i === businessDay) {
									d = new Date(newDate.getUTCFullYear(), newDate.getUTCMonth(), i);
									break;
								}
							}

							if (moment(d).isBefore(moment(newDate), 'day')) {
								for (let i = 1; i <= daysInMonthOfNextMonth; i++) {
									if (i === businessDay) {
										d = new Date(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), i);
										break;
									}
								}
							}
						} else if (isLastBusinessDay) {
							d = lastBusinessDay;
							if (moment(d).isBefore(moment(newDate), 'day')) {
								d = lastBusinessDayOfNextMonth;
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
							isPaid: true,
							recurrenceId: recurringTransaction.id,
							isToday: false,
						};

						transactionsToInsert.push(obj);

						if (
							dayInMonth === dayOfTheMonth ||
							businessDay === businessDayCount ||
							(isLastBusinessDay && lastBusinessDay.getUTCDate() === dayInMonth)
						) {
							transactionsToInsert.push({
								...obj,
								date,
								isToday: true,
							});
						}
					}
				} else {
					// Lógica para transações normais e parceladas
					const howManyInstallments = installments || 1;
					const installmentId = installments > 1 ? ulid() : null;

					for (let i = 0; i < howManyInstallments; i++) {
						transactionsToInsert.push({
							userId,
							amount: amount / howManyInstallments,
							date: moment(date).add(i, 'months').toDate(),
							type,
							teamId,
							installmentId,
							bankingAccountId,
							description:
								(description || '') +
								(howManyInstallments > 1 ? ` (${i + 1}/${howManyInstallments})` : ''),
							category: categoryRow.name,
							categoryIcon: categoryRow.icon,
							categoryId: category,
							paymentType: paymentType,
							isPaid: true,
							recurrenceId,
							isToday: false,
						});
					}
				}

				// Após gerar as transações (sejam únicas, parceladas ou recorrentes),
				// nós as inserimos no banco de dados.
				if (transactionsToInsert.length === 0) {
					continue; // Pula para a próxima iteração se nada foi gerado
				}

				for (const transaction of transactionsToInsert) {
					// Sua lógica para definir se a transação está paga ou não
					if (moment().isBefore(moment.utc(transaction.date), 'day') /* && ...outras condições */) {
						transaction.isPaid = false;
					}

					// Insere a transação e atualiza as tabelas relacionadas
					// Note que não precisamos mais de um 'trx.transaction' aninhado.
					await trx.insert(transactions).values(transaction);
					// IMPORTANTE: Passe o 'trx' para suas funções auxiliares
					await CreateOrUpdateHistories(trx, transaction);
					await CreateOrUpdateInvoices(trx, transaction);
				}
			} // Fim do loop for...of
		}); // Fim do db.transaction

		// Se chegou até aqui, tudo deu certo!
		revalidatePath('/'); // Invalide os caches necessários
		return { success: true };
	} catch (e) {
		console.error('ERRO NA TRANSAÇÃO EM LOTE:', e);
		return { error: e instanceof Error ? e.message : 'Ocorreu um erro inesperado ao salvar as transações.' };
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

	const {
		amount,
		category,
		description,
		type,
		teamId,
		bankingAccountId,
		transactionId,
		businessDay,
		dayOfTheMonth,
		paymentType,
	} = parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const transactionsResult = await db.query.recurringTransactions.findFirst({
		where: (recurringTransactions, { eq }) => eq(recurringTransactions.id, transactionId),
	});

	if (!transactionsResult) {
		return { error: 'Transação não encontrada' };
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
			paymentType: paymentType,
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
		return { error: 'Transação não encontrada' };
	}

	for (const transaction of transactionsResult) {
		await db.transaction(async (trx) => {
			await trx
				.delete(transactions)
				.where(and(eq(transactions.userId, userId), eq(transactions.id, transaction.id)));

			await SubtractFromHistories(trx, transaction);
			await SubtractFromInvoices(trx, transaction);
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

	const { amount, category, date, description, type, teamId, bankingAccountId, transactionId, paymentType } =
		parsedBody.data;

	const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

	if (!categoryRow) {
		return { error: 'Categoria não encontrada' };
	}

	const oldTransaction = await db.query.transactions.findFirst({
		where: (transactions, { eq }) => eq(transactions.id, transactionId),
	});

	if (!oldTransaction) {
		return { error: 'Transação não encontrada' };
	}

	const oldAmount = oldTransaction.amount;
	const oldDate = oldTransaction.date;
	const oldTeamId = oldTransaction.teamId;
	const oldBankingAccountId = oldTransaction.bankingAccountId;
	const oldPaymentType = oldTransaction.paymentType;

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

		if (
			oldAmount !== amount ||
			oldTeamId !== teamId ||
			!moment(date).isSame(oldDate) ||
			oldBankingAccountId !== bankingAccountId ||
			oldPaymentType !== paymentType
		) {
			let isPaid = true;
			if (moment().isBefore(startOfDay(date)) && (type === 'income' || paymentType === 'debit')) {
				isPaid = false;
			}

			await SubtractFromHistories(trx, oldTransaction);
			await SubtractFromInvoices(trx, oldTransaction);
			await CreateOrUpdateHistories(trx, { date, type, amount, userId, teamId });
			await CreateOrUpdateInvoices(trx, {
				date,
				type,
				amount,
				userId,
				teamId,
				bankingAccountId,
				paymentType,
				isPaid,
			});
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
}

async function CreateOrUpdateHistories(
	trx: DBTransactionType,
	{
		date,
		type,
		amount,
		userId,
		teamId,
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
}

export async function CreateOrUpdateInvoices(
	trx: DBTransactionType,
	{
		date,
		type,
		amount,
		userId,
		paymentType,
		bankingAccountId,
		isPaid,
		recurrenceId,
	}: Partial<transactionsType> & { date: Date; userId: string; type: string; amount: number }
) {
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
				if (isPaid) {
					await trx
						.update(bankingAccounts)
						.set({
							balance: (existingBankingAccount.balance ?? 0) + (type === 'expense' ? -amount : amount),
						})
						.where(eq(bankingAccounts.id, bankingAccountId));
				}
			} else if (paymentType === 'credit' && isPaid) {
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

async function SubtractFromInvoices(
	trx: DBTransactionType,
	{
		date,
		type,
		amount,
		bankingAccountId,
		paymentType,
		isPaid,
	}: Partial<transactionsType> & { date: Date; type: string; amount: number }
) {
	if (bankingAccountId && isPaid) {
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
						balance: (existingBankingAccount.balance ?? 0) + (type === 'expense' ? amount : -amount),
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
