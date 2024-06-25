'use client';

import React, { ReactNode, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBankingAccountSchema, createBankingAccountSchemaType } from '@/schemas';
import { Form } from './ui/form';
import CustomInput from './CustomInput';
import { Loader2, PlusSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOrUpdateBankingAccount } from '@/app/(root)/_actions/bankingAccounts';

const CreateBankingAccountDialog = ({ trigger }: { trigger?: ReactNode }) => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<createBankingAccountSchemaType>({
		resolver: zodResolver(createBankingAccountSchema),
		defaultValues: {
			name: '',
			description: '',
			payDay: 10,
			closeDay: 3,
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

			toast.success('Conta bancária criada com sucesso', {
				id: 'creating-bankingAccount',
			});

			queryClient.invalidateQueries({
				queryKey: ['banking-accounts'],
			});

			setOpen(false);
		},
	});

	const onSubmit = useCallback(
		(values: createBankingAccountSchemaType) => {
			toast.loading('Criando conta bancária', {
				id: 'creating-bankingAccount',
			});
			mutate(values);
		},
		[mutate]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ? (
					trigger
				) : (
					<Button
						variant={'ghost'}
						className='flex border-separate items-center justify-start roudned-none border-b px-3 py-3 text-muted-foreground'
					>
						<PlusSquare className='mr-2 h-4 w-4' />
						Criar nova
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Cadastre sua conta bancária</DialogTitle>
					<DialogDescription>Você pode editar/deletar elas nas configurações</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
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
					</form>
				</Form>
				<DialogFooter>
					<DialogClose asChild>
						<Button
							type='button'
							variant={'ghost'}
							onClick={() => {
								form.reset();
							}}
						>
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
};

export default CreateBankingAccountDialog;
