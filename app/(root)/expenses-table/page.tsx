'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { createTransactionsSchema, createTransactionsSchemaType } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import TeamsComboBox from '@/components/TeamsComboBox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CategoryPicker from '@/components/CategoryPicker';
import BankingAccountComboBox from '@/components/BankingAccountComboBox';
import DateSelectorDialog from '@/components/DateSelectorDialog';
import { Loader2, PlusIcon, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateTransaction } from '../_actions/transactions';
import { toast } from 'sonner';
import { DateToUTCDate } from '@/lib/utils';

const ExpensesTable = () => {
	const userSettingsQuery = useQuery({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const form = useForm<createTransactionsSchemaType>({
		resolver: zodResolver(createTransactionsSchema),
		defaultValues: {
			transactions: [{ amount: 0, description: '', date: new Date(), type: 'expense' }],
		},
	});

	const handleTeamChange = useCallback(
		({ value, index }: { value?: string; index: number }) => {
			form.setValue(`transactions.${index}.teamId`, value);
		},
		[form]
	);

	const handleBankingAccountChange = useCallback(
		({ value, index }: { value?: string; index: number }) => {
			form.setValue(`transactions.${index}.bankingAccountId`, value);
		},
		[form]
	);

	const handleCategoryChange = useCallback(
		({ value, index }: { value: string; index: number }) => {
			form.setValue(`transactions.${index}.category`, value);
		},
		[form]
	);

	const handleDateChange = useCallback(
		({ value, index }: { value: Date; index: number }) => {
			form.setValue(`transactions.${index}.date`, value);
		},
		[form]
	);

	const {
		fields: transactions,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: 'transactions',
	});

	const handleAddTransaction = () => {
		append({
			amount: 0,
			description: '',
			date: new Date(),
			category: '',
			bankingAccountId: '',
			type: 'expense',
			teamId: '',
		} as createTransactionsSchemaType['transactions'][0]);
	};

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateTransaction,
		onSuccess: (obj) => {
			if (obj && 'error' in obj) {
				toast.error(obj.error, {
					id: 'create-transactions',
				});
				return;
			}

			toast.success('Transação criada com sucesso 🎉', {
				id: 'create-transactions',
			});

			form.reset({
				transactions: [{ amount: 0, description: '', date: new Date(), type: 'expense' }],
			});

			// After creating a transaction, we need to invalidate the overview query which will refetch data in the homepage
			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});

			queryClient.invalidateQueries({
				queryKey: ['transactions'],
			});

			queryClient.invalidateQueries({
				queryKey: ['recurrent-transactions'],
			});
		},
		onError: (err) => {
			toast.error(`Erro ao criar transação`, {
				id: 'create-transactions',
			});
		},
	});

	const onSubmit = useCallback(
		(values: createTransactionsSchemaType) => {
			toast.loading('Criando transações...', { id: 'create-transactions' });
			for (const transaction of values.transactions) {
				mutate({
					...transaction,
					date: DateToUTCDate(transaction.date),
				});
			}
		},
		[mutate]
	);

	return (
		<Card className='overflow-x-auto m-4'>
			<CardContent className='p-0 min-w-[1200px]'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<table className='w-full table-auto'>
							<thead>
								<tr className='bg-gray-100 dark:bg-gray-800'>
									<th className='px-4 py-2 text-left'>Data</th>
									<th className='px-4 py-2 text-left'>Descrição</th>
									<th className='px-4 py-2 text-left'>Valor</th>
									<th className='px-4 py-2 text-left'>Time</th>
									<th className='px-4 py-2 text-left'>Categoria</th>
									<th className='px-4 py-2 text-left'>Conta</th>
									<th className='px-4 py-2 text-left'>Apagar</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map((transaction, index) => (
									<tr key={index} className='border-b border-gray-200 dark:border-gray-700'>
										<td className='px-4 py-2'>
											<DateSelectorDialog
												showLabel={false}
												control={form.control}
												dateValue={form.watch(`transactions.${index}.date`)}
												onChange={(value) => handleDateChange({ value, index })}
											/>
										</td>
										<td className='px-4 py-2'>
											<Controller
												name={`transactions.${index}.description`}
												control={form.control}
												render={({ field }) => (
													<Input type='text' placeholder='Digite a descrição' {...field} />
												)}
											/>
										</td>
										<td className='px-4 py-2'>
											<Controller
												name={`transactions.${index}.amount`}
												control={form.control}
												render={({ field }) => (
													<Input type='number' step='0.1' placeholder='Valor' {...field} />
												)}
											/>
										</td>
										<td className='px-4 py-2'>
											<TeamsComboBox
												userSettings={userSettingsQuery.data}
												onChange={(value) => handleTeamChange({ value, index })}
											/>
										</td>
										<td className='px-4 py-2'>
											<CategoryPicker
												userSettings={userSettingsQuery.data}
												type={'expense'}
												onChange={(value) => handleCategoryChange({ value, index })}
											/>
										</td>
										<td className='px-4 py-2'>
											<BankingAccountComboBox
												userSettings={userSettingsQuery.data}
												onChange={(value) => handleBankingAccountChange({ value, index })}
											/>
										</td>
										<td className='px-4 py-2'>
											<Button size='icon' variant='ghost'>
												<Trash2
													color='red'
													className='cursor-pointer'
													onClick={() => remove(index)}
													size={20}
												/>
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className='mt-4 flex justify-between p-2'>
							<Button variant={'ghost'} type='button' onClick={handleAddTransaction}>
								<PlusIcon /> Adicionar despesa
							</Button>
							<Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
								{!isPending && 'Criar despesas'}
								{isPending && (
									<>
										Criando... <Loader2 className='animate-spin' />
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default ExpensesTable;
