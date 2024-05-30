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
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusSquare } from 'lucide-react';
import React, { ReactNode, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import data from '@emoji-mart/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesType as Category, teamsType } from '@/db/schema/finance';
import { toast } from 'sonner';
import CustomInput from './CustomInput';
import { CreateTeam } from '@/app/(root)/_actions/teams';
import { createTeamSchema, createTeamSchemaType } from '@/schemas';

interface Props {
	trigger?: ReactNode;
}

function CreateCategoryDialog({ trigger }: Props) {
	const [open, setOpen] = useState(false);
	const form = useForm<createTeamSchemaType>({
		resolver: zodResolver(createTeamSchema),
		defaultValues: {
			name: '',
			description: '',
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
				queryKey: ['teams'],
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
						<CustomInput control={form.control} name='name' label='Nome' placeholder='Nome do time' />
						<CustomInput
							control={form.control}
							name='description'
							label='Descrição'
							placeholder='Descrição do time, exemplo: Casa'
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

export default CreateCategoryDialog;
