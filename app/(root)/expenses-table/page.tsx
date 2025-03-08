'use client';
import React, { use, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
	createTransactionsSchema,
	createTransactionsSchemaType,
	PossiblePaymentTypes,
	possiblePaymentTypesArray,
} from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import TeamsComboBox from '@/components/team/TeamsComboBox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CategoryPicker from '@/components/category/CategoryPicker';
import BankingAccountComboBox from '@/components/bankingAccount/BankingAccountComboBox';
import DateSelectorDialog from '@/components/common/DateSelectorDialog';
import { Loader2, Minus, Plus, PlusIcon, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateTransaction } from '../_actions/transactions';
import { toast } from 'sonner';
import { DateToUTCDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PAYMENT_TYPES_MAP } from '@/components/transaction/CreateTransactionDialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import MacroComboBox from '@/components/transaction/MacroComboBox';
import { macroType } from '@/db/schema/finance';

const ExpensesTable = () => {
	const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
	const [selectedMacros, setSelectedMacros] = useState<Record<number, macroType>>({});

	const userSettingsQuery = useQuery({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const form = useForm<createTransactionsSchemaType>({
		resolver: zodResolver(createTransactionsSchema),
		defaultValues: {
			transactions: [{ description: '', date: new Date(), type: 'expense', paymentType: 'credit' }],
		},
	});

	const handleMacroChange = useCallback(
		({ value, index }: { value: macroType; index: number }) => {
			setSelectedMacros((prev) => {
				prev[index] = value;
				return prev;
			});

			form.setValue(`transactions.${index}.amount`, value.amount ?? 0);
			form.setValue(
				`transactions.${index}.paymentType`,
				(value?.paymentType as keyof typeof PAYMENT_TYPES_MAP) || `credit`
			);
			form.setValue(`transactions.${index}.description`, value?.description || '');
			form.setValue(`transactions.${index}.teamId`, value?.teamId || '');
			form.setValue(`transactions.${index}.category`, value?.categoryId || '');
			form.setValue(`transactions.${index}.bankingAccountId`, value?.bankingAccountId || '');
		},
		[form]
	);

	const handleTeamChange = useCallback(
		({ value, index }: { value?: string; index: number }) => {
			form.setValue(`transactions.${index}.teamId`, value);
		},
		[form]
	);

	const handleBankingAccountChange = useCallback(
		({ value, index, isOnlyDebit }: { value: string; index: number; isOnlyDebit: boolean }) => {
			form.setValue(`transactions.${index}.bankingAccountId`, value);
			form.setValue(`transactions.${index}.isOnlyDebit`, isOnlyDebit);
			if (isOnlyDebit) {
				form.setValue(`transactions.${index}.paymentType`, 'debit');
			}
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
			setLastSelectedDate(value);
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
			description: '',
			date: new Date(lastSelectedDate || new Date()),
			category: '',
			bankingAccountId: '',
			type: 'expense',
			teamId: '',
			paymentType: 'credit',
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
				transactions: [
					{
						description: '',
						date: new Date(lastSelectedDate || new Date()),
						type: 'expense',
						amount: undefined,
					},
				],
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
									<TableHead>Macro</TableHead>
									<TableHead>Descrição</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Forma de pagamento</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Conta</TableHead>
									<TableHead>Apagar</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((_, index) => (
									<TableRow key={index}>
										<TableCell className='flex flex-row gap-2 items-center'>
											<Minus
												className='hover:'
												onClick={() => {
													const date = form.getValues()?.transactions?.[index]?.date;
													if (!date) {
														return;
													}
													const newDate = new Date(date);
													newDate.setDate(newDate.getDate() - 1);
													handleDateChange({ value: newDate, index });
												}}
											/>
											<DateSelectorDialog
												onlyDigitsFormat
												showLabel={false}
												control={form.control}
												dateValue={form.watch(`transactions.${index}.date`)}
												onChange={(value) => handleDateChange({ value, index })}
											/>
											<Plus
												onClick={() => {
													const date = form.getValues()?.transactions?.[index]?.date;
													if (!date) {
														return;
													}
													const newDate = new Date(date);
													newDate.setDate(newDate.getDate() + 1);
													handleDateChange({ value: newDate, index });
												}}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.description`}
												control={form.control}
												render={({ field }) => (
													<MacroComboBox
														small
														onChange={(value) => handleMacroChange({ value, index })}
													/>
												)}
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
													<Input type='currency' className='w-24' {...field} />
												)}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.paymentType`}
												control={form.control}
												render={({ field }) => (
													<Select
														onValueChange={(value) => {
															form.setValue(
																`transactions.${index}.paymentType`,
																value as PossiblePaymentTypes
															);
														}}
														{...field}
													>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder='Selecionar tipo' />
														</SelectTrigger>
														<SelectContent>
															{possiblePaymentTypesArray.map((type, i) => {
																return (
																	<SelectItem key={i} value={type}>
																		{
																			PAYMENT_TYPES_MAP[
																				type as keyof typeof PAYMENT_TYPES_MAP
																			]
																		}
																	</SelectItem>
																);
															})}
														</SelectContent>
													</Select>
												)}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.teamId`}
												control={form.control}
												render={({ field }) => (
													<TeamsComboBox
														isExpensesTable
														userSettings={userSettingsQuery.data}
														onChange={(value) => handleTeamChange({ value, index })}
														firstSelectedValue={selectedMacros?.[index]?.teamId}
													/>
												)}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.category`}
												control={form.control}
												render={({ field }) => (
													<CategoryPicker
														userSettings={userSettingsQuery.data}
														type={'expense'}
														onChange={(value) => handleCategoryChange({ value, index })}
														firstSelectedValue={selectedMacros?.[index]?.categoryId}
													/>
												)}
											/>
										</TableCell>
										<TableCell>
											<Controller
												name={`transactions.${index}.bankingAccountId`}
												control={form.control}
												render={({ field }) => (
													<BankingAccountComboBox
														userSettings={userSettingsQuery.data}
														onChange={(value, isOnlyDebit) =>
															handleBankingAccountChange({ value, index, isOnlyDebit })
														}
														firstSelectedValue={selectedMacros?.[index]?.bankingAccountId}
													/>
												)}
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
