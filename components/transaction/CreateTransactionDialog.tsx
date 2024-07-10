'use client';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionType, DateToUTCDate } from '@/lib/utils';
import {
	createTransactionSchemaType,
	createTransactionSchema,
	PossiblePaymentTypes,
	possiblePaymentTypesArray,
} from '@/schemas';
import CustomInput from '../common/CustomInput';
import { Switch } from '../ui/switch';
import CategoryPicker from '../category/CategoryPicker';
import { CreateTransaction } from '@/app/(root)/_actions/transactions';
import { userSettingsType } from '@/db/schema/finance';
import BankingAccountComboBox from '../bankingAccount/BankingAccountComboBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GetFormatterForCurrency } from '@/lib/currencies';
import TeamsComboBox from '../team/TeamsComboBox';
import DateSelectorDialog from '../common/DateSelectorDialog';
import Link from 'next/link';
import { Checkbox } from './ui/checkbox';

interface Props {
	trigger: ReactNode;
	type: TransactionType;
	isSelected?: boolean;
}

export const PAYMENT_TYPES_MAP = {
	credit: 'Crédito',
	debit: 'Débito / Pix / Boleto',
};

function CreateTransactionDialog({ trigger, type = 'income', isSelected }: Props) {
	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const userSettings = userSettingsQuery.data;

	const currencyFormatter: ReturnType<typeof GetFormatterForCurrency> = GetFormatterForCurrency(
		userSettings?.currency || 'BRL'
	);

	const form = useForm<createTransactionSchemaType>({
		resolver: zodResolver(createTransactionSchema),
		defaultValues: {
			type,
			description: '',
			amount: 0,
			paymentType: type === 'expense' ? 'credit' : undefined,
			date: new Date(),
			businessDay: 0,
			dayOfTheMonth: 0,
		},
	});

	const [open, setOpen] = useState(false);
	const isRecurringValue = form.watch('isRecurring');
	const dateValue = form.watch('date');
	const dayOfTheMonth = form.watch('dayOfTheMonth');
	const businessDay = form.watch('businessDay');
	const isLastBusinessDay = form.watch('isLastBusinessDay');
	const paymentType = form.watch('paymentType');
	const amount = form.watch('amount');

	useEffect(() => {
		if (isSelected) {
			setOpen(true);
		}
	}, [isSelected]);

	const handleCategoryChange = useCallback(
		(value: string) => {
			form.setValue('category', value);
		},
		[form]
	);

	const handleTeamChange = useCallback(
		(value?: string) => {
			form.setValue('teamId', value);
		},
		[form]
	);

	const handleBankingAccountChange = useCallback(
		(value: string) => {
			form.setValue('bankingAccountId', value);
		},
		[form]
	);

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateTransaction,
		onSuccess: (obj) => {
			if (obj && 'error' in obj) {
				toast.error(obj.error, {
					id: 'create-transaction',
				});
				return;
			}

			toast.success('Transação criada com sucesso 🎉', {
				id: 'create-transaction',
			});

			form.reset({
				type,
				description: '',
				bankingAccountId: '',
				amount: 0,
				date: new Date(),
				businessDay: 0,
				dayOfTheMonth: 0,
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

			queryClient.invalidateQueries({
				queryKey: ['invoices'],
			});

			setOpen((prev) => !prev);
		},
		onError: (err) => {
			toast.error(`Erro ao criar transação`, {
				id: 'create-transaction',
			});
		},
	});

	const onSubmit = useCallback(
		(values: createTransactionSchemaType) => {
			toast.loading('Criando transação...', { id: 'create-transaction' });
			mutate({
				...values,
				date: DateToUTCDate(values.date),
			});
		},
		[mutate]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='overflow-y-auto max-h-screen'>
				<DialogHeader>
					<DialogTitle>
						Criar nova <TransactionTitle type={type} />
						{type === 'expense' && (
							<>
								{', ou '}{' '}
								<Link className='underline text-blue-500' href='/expenses-table'>
									cadastrar em lote
								</Link>
							</>
						)}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
						<CustomInput
							control={form.control}
							name='description'
							label='Descrição'
							placeholder='Digite a descrição da transação'
						/>
						<FormField
							control={form.control}
							name='teamId'
							render={() => (
								<FormItem className='flex flex-col'>
									<FormLabel>Time</FormLabel>
									<FormControl>
										<TeamsComboBox userSettings={userSettings} onChange={handleTeamChange} />
									</FormControl>
									<FormDescription>Selecione o time para a transação</FormDescription>
								</FormItem>
							)}
						/>
						<div className='flex items-center gap-2'>
							<CustomInput
								fullWidth={type !== 'expense'}
								control={form.control}
								name='amount'
								label='Valor'
								type='number'
							/>
							{type === 'expense' && (
								<FormField
									control={form.control}
									name='paymentType'
									render={() => (
										<FormItem className='flex flex-col w-1/2'>
											<FormLabel className='pb-2'>Tipo de pagamento</FormLabel>
											<FormControl>
												<Select
													onValueChange={(value) => {
														form.setValue('paymentType', value as PossiblePaymentTypes);
													}}
													value={form.getValues('paymentType')}
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
											</FormControl>
										</FormItem>
									)}
								/>
							)}
						</div>

						{paymentType === 'credit' && !isRecurringValue && (
							<FormField
								control={form.control}
								name='installments'
								render={() => (
									<FormItem className='flex flex-col'>
										<FormLabel className='pb-2'>Quantidade de parcelas</FormLabel>
										<FormControl>
											<Select
												onValueChange={(value) => {
													form.setValue('installments', parseInt(value));
												}}
											>
												<SelectTrigger className='w-full'>
													<SelectValue placeholder='Parcelas' />
												</SelectTrigger>
												<SelectContent>
													{Array.from({
														length:
															amount >= 100
																? amount >= 1000
																	? amount >= 10000
																		? 60
																		: 24
																	: 12
																: 5,
													}).map((_, i) => {
														const currentValue = i + 1;
														return (
															<SelectItem
																key={currentValue}
																value={currentValue.toString()}
															>
																{i + 1} x{' '}
																{currencyFormatter.format(amount / currentValue)}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						)}

						<div className='flex items-center gap-2'>
							<FormField
								control={form.control}
								name='category'
								render={() => (
									<FormItem className='flex flex-col w-1/2'>
										<FormLabel>Categoria</FormLabel>
										<FormControl>
											<CategoryPicker
												userSettings={userSettings}
												type={type}
												onChange={handleCategoryChange}
												isTeamSelected={Boolean(form.watch('teamId'))}
											/>
										</FormControl>
										<FormDescription>Selecione a categoria da sua transação</FormDescription>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='bankingAccountId'
								render={() => (
									<FormItem className='flex flex-col'>
										<FormLabel>Conta bancária</FormLabel>
										<FormControl>
											<BankingAccountComboBox
												userSettings={userSettings}
												onChange={handleBankingAccountChange}
											/>
										</FormControl>
										<FormDescription>Selecione a conta da sua transação</FormDescription>
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name='isRecurring'
							render={({ field }) => (
								<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
									<div className='space-y-0.5'>
										<FormLabel className='text-base'>É recorrente?</FormLabel>
										<FormDescription>
											Selecione caso sua <TransactionTitle type={type} /> for recorrente{' '}
										</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						{!isRecurringValue && <DateSelectorDialog control={form.control} dateValue={dateValue} />}

						{isRecurringValue && (
							<div className='flex gap-3'>
								<CustomInput
									control={form.control}
									type='number'
									label='Dia do mês'
									name='dayOfTheMonth'
									placeholder='Digite o dia fixo do mês'
									disabled={Boolean(businessDay && businessDay > 0) || Boolean(isLastBusinessDay)}
								/>

								<CustomInput
									control={form.control}
									type='number'
									label='Dia do útil do mês'
									name='businessDay'
									placeholder='Digite o dia útil'
									disabled={Boolean(dayOfTheMonth && dayOfTheMonth > 0) || Boolean(isLastBusinessDay)}
								/>
							</div>
						)}
						{isRecurringValue && (
							<FormField
								control={form.control}
								name="isLastBusinessDay"
								render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
									<FormControl>
									<Checkbox
										checked={field.value || false}
										onCheckedChange={field.onChange}
										disabled={Boolean(businessDay && businessDay > 0) || Boolean(dayOfTheMonth && dayOfTheMonth > 0)}
									/>
									</FormControl>
									<div className="space-y-1 leading-none">
									<FormLabel>
										Último dia útil do mês
									</FormLabel>
									</div>
								</FormItem>
								)}
							/>
						)}
					</form>
				</Form>

				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='ghost' onClick={() => {}}>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
						{!isPending && 'Criar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function TransactionTitle({ type }: { type: string }) {
	return (
		<span className={cn(type === 'income' ? 'text-income-foreground' : 'text-expense-foreground')}>
			{type === 'income' ? 'receita' : 'despesa'}
		</span>
	);
}

export default CreateTransactionDialog;
