'use client';

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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusSquare } from 'lucide-react';
import React, { ReactNode, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import data from '@emoji-mart/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsType } from '@/db/schema/finance';
import { toast } from 'sonner';
import CustomInput from '../common/CustomInput';
import { CreateTeam } from '@/app/(root)/_actions/teams';
import { createTeamSchema, createTeamSchemaType } from '@/schemas';
import { Switch } from '@/components/ui/switch';

interface Props {
	trigger?: ReactNode;
}

function CreateTeamDialog({ trigger }: Props) {
	const [open, setOpen] = useState(false);
	const form = useForm<createTeamSchemaType>({
		resolver: zodResolver(createTeamSchema),
		defaultValues: {
			name: '',
			description: '',
			hideOnLandingPage: false,
		},
	});

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateTeam,
		onSuccess: async (data: teamsType) => {
			form.reset({
				name: '',
				description: '',
			});

			toast.success(`Time ${data.name} criado com sucesso 🎉`, {
				id: 'create-team',
			});

			await queryClient.invalidateQueries({
				queryKey: ['teams-members'],
			});

			await queryClient.invalidateQueries({
				queryKey: ['teams-with-members'],
			});

			setOpen((prev) => !prev);
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: 'create-team',
			});
		},
	});

	const onSubmit = useCallback(
		(values: createTeamSchemaType) => {
			toast.loading('Criando time...', {
				id: 'create-team',
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
						Criar novo
					</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Criar time</DialogTitle>
					<DialogDescription>Time são usados para compartilhar transações</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<CustomInput
							control={form.control}
							name='name'
							label='Nome'
							placeholder='Exemplo: Casa ou investimentos'
						/>
						<CustomInput
							control={form.control}
							name='description'
							label='Descrição'
							placeholder='Exemplo: Conta da casa'
						/>
						<FormField
							control={form.control}
							name='hideOnLandingPage'
							render={({ field }) => (
								<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
									<div className='space-y-0.5'>
										<FormLabel className='text-base'>Não selecionar automaticamente</FormLabel>
										<FormDescription>
											Ess opção faz com que o time não seja selecionado automaticamente na tela
											inicial
										</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
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
}

export default CreateTeamDialog;
