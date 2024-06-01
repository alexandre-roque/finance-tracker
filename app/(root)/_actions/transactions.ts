'use server';

import moment from 'moment';
import { auth } from '@/auth';
import { db } from '@/db';
import {
    categories,
    monthHistories,
    recurringTransactions,
    transactions,
    transactionsType,
    yearHistories,
} from '@/db/schema/finance';
import { DateToUTCDate, TransactionType, getBusinessDayOfMonth } from '@/lib/utils';
import { createTransactionSchema, createTransactionSchemaType } from '@/schemas';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ulid } from 'ulid';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';

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
        installments,
    } = parsedBody.data;

    const [categoryRow] = await db.select().from(categories).where(eq(categories.id, category));

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
                    cardId: cardId ?? null,
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
                        cardId: cardId ?? null,
                        date: DateToUTCDate(new Date()),
                        description: description || '',
                        category: categoryRow.name,
                        categoryIcon: categoryRow.icon,
                    });

                    await CreateOrUpdateHistories({ trx, date: DateToUTCDate(new Date()), type, amount, userId });
                }
            }

            return;
        }

        let howManyInstallments = !installments ? 1 : installments;
        const installmentId = installments > 1 ? ulid() : null;

        for (let i = 0; i < (howManyInstallments ?? 1); i++) {
            await trx.insert(transactions).values({
                userId,
                amount: amount / howManyInstallments,
                date: moment(date).add(i, 'months').toDate(),
                type,
                teamId,
                installmentId,
                cardId: cardId ?? null,
                description: (description || '') + (howManyInstallments > 1 ? ` (${i + 1}/${howManyInstallments})` : ''),
                category: categoryRow.name,
                categoryIcon: categoryRow.icon,
            });

            await CreateOrUpdateHistories({ trx, date, type, amount, userId });
        }
    });
}

export async function DeleteTransaction({ transactionId, installmentId }: { transactionId: string; installmentId?: string }) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/sign-in');
    }

    const userId = session.user.id;
    const query = installmentId
        ? and(eq(transactions.userId, userId), eq(transactions.installmentId, installmentId))
        : and(eq(transactions.userId, userId), eq(transactions.id, transactionId));
    const transactionsResult = await db.select().from(transactions).where(query);

    if (!transactionsResult?.length) {
        throw new Error('Bad request');
    }

    for (const transaction of transactionsResult) {
        const { date, amount, type } = transaction;

        await db.transaction(async (trx) => {
            await trx.delete(transactions).where(and(eq(transactions.userId, userId), eq(transactions.id, transaction.id)));
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
                        expense: (existingMonthHistory.expense ?? 0) - (type === 'expense' ? amount : 0),
                        income: (existingMonthHistory.income ?? 0) - (type === 'income' ? amount : 0),
                    })
                    .where(
                        and(
                            eq(monthHistories.userId, userId),
                            eq(monthHistories.day, date.getUTCDate()),
                            eq(monthHistories.month, date.getUTCMonth()),
                            eq(monthHistories.year, date.getUTCFullYear())
                        )
                    );
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
                        expense: (existingYearHistory.expense ?? 0) - (type === 'expense' ? amount : 0),
                        income: (existingYearHistory.income ?? 0) - (type === 'income' ? amount : 0),
                    })
                    .where(
                        and(
                            eq(yearHistories.userId, userId),
                            eq(yearHistories.month, date.getUTCMonth()),
                            eq(yearHistories.year, date.getUTCFullYear())
                        )
                    );
            }
        });
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
