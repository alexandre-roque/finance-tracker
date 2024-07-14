'use client';

import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBankingAccountSchema, createBankingAccountSchemaType } from '@/schemas';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';
import CustomInput from '../common/CustomInput';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bankingAccountsType } from '@/db/schema/finance';
import { CreateOrUpdateBankingAccount } from '@/app/(root)/_actions/bankingAccounts';
import { Switch } from '../ui/switch';

const EditBankingAccountForm = ({
	setIsOpen,
	bankingAccount,
}: {
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	bankingAccount: bankingAccountsType;
}) => {
	const queryClient = useQueryClient();

	const form = useForm<createBankingAccountSchemaType>({
		resolver: zodResolver(createBankingAccountSchema),
		defaultValues: {
			name: bankingAccount.name || '',
			description: bankingAccount.description || '',
			payDay: bankingAccount.payDay || 10,
			closeDay: bankingAccount.closeDay || 3,
			balance: bankingAccount.balance || 0,
			bankingAccountId: bankingAccount.id,
			hideInBalance: bankingAccount.hideInBalance || false,
			automaticDebitInvoices: bankingAccount.automaticDebitInvoices || false,
		},
	});

	const isOnlyDebit = form.watch('isOnlyDebit');

	const { mutate, isPending } = useMutation({
		mutationFn: CreateOrUpdateBankingAccount,
		onSuccess: ({ error }) => {
			if (error) {
				toast.error(error, {
					id: 'creating-banking-account',
				});
				return;
			}

			toast.success('Conta bancária editada com sucesso', {
				id: 'creating-banking-account',
			});

			queryClient.invalidateQueries({
				queryKey: ['banking-accounts'],
			});

			setIsOpen(false);
		},
	});

	const onSubmit = useCallback(
		(values: createBankingAccountSchemaType) => {
			toast.loading('Editando conta bancária', {
				id: 'creating-banking-account',
			});

			mutate({
				...values,
				bankingAccountId: bankingAccount.id,
			});
		},
		[bankingAccount.id, mutate]
	);

	return (
		<Form {...form}>
			<form className='flex flex-col space-y-2 md:px-0 px-4 gap-3' onSubmit={form.handleSubmit(onSubmit)}>
				<CustomInput
					control={form.control}
					name='name'
					label='Nome'
					placeholder='Digite o nome que você quer dar'
				/>

				<CustomInput
					control={form.control}
					name='description'
					label='Descrição'
					placeholder='Exemplo: Conta da Nubank'
				/>

				<CustomInput
					control={form.control}
					name='closeDay'
					label='Dia de fechamento'
					placeholder='Exemplo: 3'
					type='number'
				/>

				<CustomInput
					control={form.control}
					name='payDay'
					label='Dia de pagamento'
					placeholder='Exemplo: 10'
					type='number'
				/>

				<CustomInput
					control={form.control}
					name='balance'
					label='Valor em conta'
					type='number'
					placeholder='Exemplo: 1000'
				/>

				<FormField
					control={form.control}
					name='hideInBalance'
					render={({ field }) => (
						<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
							<div className='space-y-0.5'>
								<FormLabel className='text-base'>Esconder no valor total em contas</FormLabel>
								<FormDescription>
									Essa opção faz com que a conta não seja levada em consideração no valor total em
									contas, por exemplo, uma conta de investimentos
								</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='isOnlyDebit'
					render={({ field }) => (
						<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
							<div className='space-y-0.5'>
								<FormLabel className='text-base'>Somente débito</FormLabel>
								<FormDescription>
									Essa opção faz com que somente seja exibida a opção de débito para compras nessa
									conta bancária
								</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>

				{!isOnlyDebit && (
					<FormField
						control={form.control}
						name='automaticDebitInvoices'
						render={({ field }) => (
							<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
								<div className='space-y-0.5'>
									<FormLabel className='text-base'>Débito automático das faturas</FormLabel>
									<FormDescription>
										Essa opção faz com que no dia do pagamento da fatura, o valor seja debitado
										automaticamente da conta
									</FormDescription>
								</div>
								<FormControl>
									<Switch checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
							</FormItem>
						)}
					/>
				)}

				<Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
					<>
						{isPending ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Editando...
							</>
						) : (
							'Editar'
						)}
					</>
				</Button>
			</form>
		</Form>
	);
};

export default EditBankingAccountForm;
