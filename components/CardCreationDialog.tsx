'use client';

import React, { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCardSchema as formSchema } from '@/schemas';
import { z } from 'zod';
import { Form } from './ui/form';
import CustomInput from './CustomInput';
import { Loader2, PlusSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const CardCreationDialog = ({ trigger }: { trigger?: ReactNode }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			cardNumber: '',
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);

		toast.loading('Criando cartão', {
			id: 'creating-card',
		});

		await fetch('/api/cards', {
			method: 'POST',
			body: JSON.stringify({
				name: values.name,
				number: values.cardNumber,
			}),
		}).then((res) => {
			if (res.status === 200) {
				toast.success('Cartão criado com sucesso', {
					id: 'creating-card',
				});

				queryClient.invalidateQueries({
					queryKey: ['cards'],
				});
			} else {
				toast.error('Erro ao criar cartão', {
					id: 'creating-card',
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
						Criar novo
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Cadastre seu cartão</DialogTitle>
					<DialogDescription>Você pode editar/deletar eles nas configurações</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
						<CustomInput
							control={form.control}
							name='name'
							label='Nome'
							placeholder='Digite o nome que você quer dar para o cartão'
						/>

						<CustomInput
							control={form.control}
							name='cardNumber'
							label='Últimos 4 digitos'
							placeholder='Exemplo: 1234'
						/>
					</form>
				</Form>
				<DialogFooter>
					<Button disabled={isLoading} onClick={form.handleSubmit(onSubmit)} className='w-full mt-6'>
						{isLoading ? <Loader2 className='animate-spin' /> : 'Cadastrar'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CardCreationDialog;
