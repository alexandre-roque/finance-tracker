'use client';
import React, { useCallback } from 'react';

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionType } from '@/lib/utils';
import { PossiblePaymentTypes, editRecurrentTransactionSchema, editRecurrentTransactionSchemaType, possiblePaymentTypesArray } from '@/schemas';
import CustomInput from './CustomInput';
import CategoryPicker from './CategoryPicker';
import { EditRecurrentTransaction } from '@/app/(root)/_actions/transactions';
import { recurringTransactionsType, } from '@/db/schema/finance';
import TeamsComboBox from './TeamsComboBox';
import { PAYMENT_TYPES_MAP, TransactionTitle } from './CreateTransactionDialog';
import BankingAccountComboBox from './BankingAccountComboBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	transaction: recurringTransactionsType;
}

function EditRecurrentTransactionsDialog({ open, setOpen, transaction }: Props) {
	const form = useForm<editRecurrentTransactionSchemaType>({
		resolver: zodResolver(editRecurrentTransactionSchema),
		defaultValues: {
			type: transaction.type as TransactionType,
			description: transaction.description || '',
			teamId: transaction.teamId || undefined,
			amount: transaction.amount,
			category: transaction.categoryId || undefined,
			bankingAccountId: transaction.bankingAccountId ?? undefined,
			transactionId: transaction.id,
			businessDay: transaction.businessDay || 0,
			dayOfTheMonth: transaction.dayOfTheMonth || 0,
			paymentType: transaction.paymentType as PossiblePaymentTypes || undefined,
		},
	});

	const dayOfTheMonth = form.watch('dayOfTheMonth');
	const businessDay = form.watch('businessDay');

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
		mutationFn: EditRecurrentTransaction,
		onSuccess: (obj) => {
			if (obj && 'error' in obj) {
				toast.error(obj.error, {
					id: 'edit-transaction',
				});
				return;
			}

			toast.success('Transação editada com sucesso 🎉', {
				id: 'edit-transaction',
			});

			form.reset({
				description: '',
				bankingAccountId: '',
				amount: 0,
			});

			queryClient.invalidateQueries({
				queryKey: ['recurrent-transactions'],
			});

			setOpen(false);
		},
		onError: (err) => {
			toast.error(`Erro ao editar transação ${err.message}`, {
				id: 'edit-transaction',
			});
		},
	});

	const onSubmit = useCallback(
		(values: editRecurrentTransactionSchemaType) => {
			toast.loading('Editando transação...', { id: 'edit-transaction' });
			mutate({
				...values,
				transactionId: transaction.id,
			});
		},
		[mutate, transaction.id]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Editar <TransactionTitle type={transaction.type} />
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
										<TeamsComboBox
											firstSelectedValue={transaction.teamId}
											onChange={handleTeamChange}
										/>
									</FormControl>
									<FormDescription>Selecione o time para a transação</FormDescription>
								</FormItem>
							)}
						/>
						<div className='flex items-center gap-2'>
							<CustomInput control={form.control} name='amount' label='Valor' type='number' />
							{transaction.type === 'expense' && (
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

						<div className='flex items-center gap-2'>
							<FormField
								control={form.control}
								name='category'
								render={() => (
									<FormItem className='flex flex-col w-1/2'>
										<FormLabel>Categoria</FormLabel>
										<FormControl>
											<CategoryPicker
												firstSelectedValue={transaction.categoryId}
												type={transaction.type as TransactionType}
												onChange={handleCategoryChange}
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
									<FormItem className='flex flex-col w-1/2'>
										<FormLabel>Conta bancária</FormLabel>
										<FormControl>
											<BankingAccountComboBox
												firstSelectedValue={transaction.bankingAccountId}
												onChange={handleBankingAccountChange}
											/>
										</FormControl>
										<FormDescription>Selecione a conta bancária da sua transação</FormDescription>
									</FormItem>
								)}
							/>
						</div>
						<div className='flex gap-3'>
							<CustomInput
								control={form.control}
								type='number'
								label='Dia do mês'
								name='dayOfTheMonth'
								placeholder='Digite o dia fixo do mês'
								disabled={Boolean(businessDay && businessDay > 0)}
							/>

							<CustomInput
								control={form.control}
								type='number'
								label='Dia do útil do mês'
								name='businessDay'
								placeholder='Digite o dia útil'
								disabled={Boolean(dayOfTheMonth && dayOfTheMonth > 0)}
							/>
						</div>
					</form>
				</Form>

				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='ghost' onClick={() => {}}>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
						{!isPending && 'Atualizar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default EditRecurrentTransactionsDialog;
