'use client';

import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBankingAccountSchema, createBankingAccountSchemaType } from '@/schemas';
import { z } from 'zod';
import { Form } from './ui/form';
import CustomInput from './CustomInput';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bankingAccountsType } from '@/db/schema/finance';
import { CreateOrUpdateBankingAccount } from '@/app/(root)/_actions/bankingAccounts';

const EditBankingAccountForm = ({
	setIsOpen,
	bankingAccount,
}: {
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	bankingAccount: bankingAccountsType;
}) => {
	const queryClient = useQueryClient();
	console.log(bankingAccount);

	const form = useForm<createBankingAccountSchemaType>({
		resolver: zodResolver(createBankingAccountSchema),
		defaultValues: {
			name: bankingAccount.name || '',
			description: bankingAccount.description || '',
			payDay: bankingAccount.payDay || 10,
			closeDay: bankingAccount.closeDay || 3,
			bankingAccountId: bankingAccount.id,
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: CreateOrUpdateBankingAccount,
		onSuccess: ({ error }) => {
			if (error) {
				toast.error(error, {
					id: 'creating-bankingAccount',
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
			<form className='flex flex-col space-y-2 md:px-0 px-4' onSubmit={form.handleSubmit(onSubmit)}>
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
