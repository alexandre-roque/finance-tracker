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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Descrição</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Conta</TableHead>
									<TableHead>Apagar</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((_, index) => (
									<TableRow key={index}>
										<TableCell>
											<DateSelectorDialog
												onlyDigitsFormat
												showLabel={false}
												control={form.control}
												dateValue={form.watch(`transactions.${index}.date`)}
												onChange={(value) => handleDateChange({ value, index })}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.description`}
												control={form.control}
												render={({ field }) => <Input type='text' {...field} />}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.amount`}
												control={form.control}
												render={({ field }) => (
													<Input
														className='w-24'
														type='number'
														step='0.1'
														placeholder='Valor'
														{...field}
													/>
												)}
											/>
										</TableCell>
										<TableCell>
											<TeamsComboBox
												userSettings={userSettingsQuery.data}
												onChange={(value) => handleTeamChange({ value, index })}
											/>
										</TableCell>
										<TableCell>
											<CategoryPicker
												userSettings={userSettingsQuery.data}
												type={'expense'}
												onChange={(value) => handleCategoryChange({ value, index })}
											/>
										</TableCell>
										<TableCell>
											<BankingAccountComboBox
												userSettings={userSettingsQuery.data}
												onChange={(value) => handleBankingAccountChange({ value, index })}
											/>
										</TableCell>
										<TableCell>
											<Button size='icon' variant='ghost'>
												<Trash2
													color='red'
													className='cursor-pointer'
													onClick={() => remove(index)}
													size={20}
												/>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
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
