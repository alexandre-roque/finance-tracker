'use client';

import React, { ReactNode, useState } from 'react';
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
import { createBankingAccountSchema as formSchema } from '@/schemas';
import { z } from 'zod';
import { Form } from './ui/form';
import CustomInput from './CustomInput';
import { Loader2, PlusSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const CreateBankingAccountDialog = ({ trigger }: { trigger?: ReactNode }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);

		toast.loading('Criando conta bancária', {
			id: 'creating-bankingAccount',
		});

		await fetch('/api/banking-accounts', {
			method: 'POST',
			body: JSON.stringify({
				name: values.name,
				number: values.description,
			}),
		}).then((res) => {
			if (res.status === 200) {
				toast.success('Conta bancária criada com sucesso', {
					id: 'creating-bankingAccount',
				});

				queryClient.invalidateQueries({
					queryKey: ['banking-accounts'],
				});
			} else {
				toast.error('Erro ao criar conta bancária', {
					id: 'creating-bankingAccount',
				});
			}
		});

		setIsLoading(false);
		setOpen(false);
	};

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
					<Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
						{!isLoading && 'Criar'}
						{isLoading && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateBankingAccountDialog;
