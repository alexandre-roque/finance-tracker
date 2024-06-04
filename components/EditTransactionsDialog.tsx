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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionType, DateToUTCDate } from '@/lib/utils';
import { editTransactionSchema, editTransactionSchemaType } from '@/schemas';
import CustomInput from './CustomInput';
import CategoryPicker from './CategoryPicker';
import { EditTransaction } from '@/app/(root)/_actions/transactions';
import { transactionsType } from '@/db/schema/finance';
import TeamsComboBox from './TeamsComboBox';
import { TransactionTitle } from './CreateTransactionDialog';
import BankingAccountComboBox from './BankingAccountComboBox';
import DateSelectorDialog from './DateSelectorDialog';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	transaction: transactionsType;
}

function EditTransactionsDialog({ open, setOpen, transaction }: Props) {
	const form = useForm<editTransactionSchemaType>({
		resolver: zodResolver(editTransactionSchema),
		defaultValues: {
			type: transaction.type as TransactionType,
			description: transaction.description || '',
			bankingAccountId: transaction.bankingAccountId ?? undefined,
			amount: transaction.amount,
			date: transaction.date,
			transactionId: transaction.id,
			category: transaction.categoryId || undefined,
		},
	});

	const dateValue = form.watch('date');

	const handleCategoryChange = useCallback(
		(value: string) => {
			form.setValue('category', value);
		},
		[form]
	);

	const handleTeamChange = useCallback(
		(value: string) => {
			form.setValue('teamId', value);
		},
		[form]
	);

	const handleCardChange = useCallback(
		(value?: string) => {
			form.setValue('bankingAccountId', value);
		},
		[form]
	);

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: EditTransaction,
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
				date: new Date(),
			});

			// After creating a transaction, we need to invalidate the overview query which will refetch data in the homepage
			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});

			queryClient.invalidateQueries({
				queryKey: ['transactions'],
			});

			// setOpen((prev) => !prev);
		},
		onError: (err) => {
			toast.error(`Erro ao editar transação ${err.message}`, {
				id: 'edit-transaction',
			});
		},
	});

	const onSubmit = useCallback(
		(values: editTransactionSchemaType) => {
			toast.loading('Editando transação...', { id: 'edit-transaction' });
			mutate({
				...values,
				date: DateToUTCDate(values.date),
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
						<CustomInput control={form.control} name='amount' label='Valor' type='number' />

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
									<FormItem className='flex flex-col'>
										<FormLabel>Conta bancária</FormLabel>
										<FormControl>
											<BankingAccountComboBox
												firstSelectedValue={transaction.bankingAccountId}
												onChange={handleCardChange}
											/>
										</FormControl>
										<FormDescription>Selecione a conta bancária da sua transação</FormDescription>
									</FormItem>
								)}
							/>
						</div>
						<DateSelectorDialog control={form.control} dateValue={dateValue} />
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

export default EditTransactionsDialog;
