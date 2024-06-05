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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionType } from '@/lib/utils';
import { editCategorySchema, editCategorySchemaType } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleOff, Loader2, PlusSquare } from 'lucide-react';
import React, { ReactNode, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesType as Category, categoriesType } from '@/db/schema/finance';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { EditCategory } from '@/app/(root)/_actions/categories';
import { TransactionTitle } from './CreateTransactionDialog';
import CustomInput from './CustomInput';
import { Switch } from './ui/switch';

interface Props {
	category: categoriesType;
	trigger?: ReactNode;
}

function EditCategoryDialog({ category, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const form = useForm<editCategorySchemaType>({
		resolver: zodResolver(editCategorySchema),
		defaultValues: {
			...category,
			sharable: category.sharable ?? false,
			type: category.type as TransactionType,
		},
	});

	const queryClient = useQueryClient();
	const theme = useTheme();

	const { mutate, isPending } = useMutation({
		mutationFn: EditCategory,
		onSuccess: async (data: Category) => {
			toast.success(`Categoria ${data.name} editada com sucesso 🎉`, {
				id: 'edit-category',
			});

			queryClient.invalidateQueries({
				queryKey: ['categories'],
			});

			setOpen((prev) => !prev);
		},
		onError: (e) => {
			toast.error(`Algo deu errado: ${e.message}`, {
				id: 'edit-category',
			});
		},
	});

	const onSubmit = useCallback(
		(values: editCategorySchemaType) => {
			toast.loading('Editando categoria...', {
				id: 'edit-category',
			});
			mutate({
				...values,
				type: category.type as TransactionType,
				id: category.id,
			});
		},
		[mutate, category]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Editar categoria de <TransactionTitle type={category.type} />
					</DialogTitle>
					<DialogDescription>
						Ao editar uma categoria, as transações anteriores ficaram com o mesmo emoji/nome
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<CustomInput
							control={form.control}
							name='name'
							label='Nome'
							placeholder='Categoria'
							description='Sua categoria aparecerá assim no site'
						/>

						<FormField
							control={form.control}
							name='icon'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ícone</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant={'outline'} className='h-[100px] w-full'>
													{form.watch('icon') ? (
														<div className='flex flex-col items-center gap-2'>
															<span className='text-5xl' role='img'>
																{field.value}
															</span>
															<p className='text-xs text-muted-foreground'>
																Clique para alterar
															</p>
														</div>
													) : (
														<div className='flex flex-col items-center gap-2'>
															<CircleOff className='h-[48px] w-[48px]' />
															<p className='text-xs text-muted-foreground'>
																Clique para selecionar
															</p>
														</div>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-full'>
												<Picker
													locale='pt'
													data={data}
													theme={theme.resolvedTheme}
													onEmojiSelect={(emoji: { native: string }) => {
														field.onChange(emoji.native);
													}}
												/>
											</PopoverContent>
										</Popover>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='sharable'
							render={({ field }) => (
								<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
									<div className='space-y-0.5'>
										<FormLabel className='text-base'>É compartilhável?</FormLabel>
										<FormDescription>
											Pode ser usada pelos membros dos times que faz parte
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
						{!isPending && 'Editar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default EditCategoryDialog;
