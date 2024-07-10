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
import { createCategorySchema, createCategorySchemaType } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleOff, Loader2, PlusSquare } from 'lucide-react';
import React, { ReactNode, useCallback, useState } from 'react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesType as Category } from '@/db/schema/finance';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { CreateCategory } from '@/app/(root)/_actions/categories';
import { TransactionTitle } from '../transaction/CreateTransactionDialog';
import CustomInput from '../common/CustomInput';
import { Switch } from '../ui/switch';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Props {
	type: TransactionType;
	successCallback: (category: Category) => void;
	trigger?: ReactNode;
}

function CreateCategoryDialog({ type, successCallback, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const form = useForm<createCategorySchemaType>({
		resolver: zodResolver(createCategorySchema),
		defaultValues: {
			name: '',
			icon: type === 'income' ? '💰' : '💸',
			type,
		},
	});

	const iconValue = form.watch('icon');
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateCategory,
		onSuccess: async (data: Category) => {
			form.reset({
				name: '',
				icon: '',
				type,
			});

			toast.success(`Categoria ${data.name} criada com sucesso 🎉`, {
				id: 'create-category',
			});

			successCallback(data);

			await queryClient.invalidateQueries({
				queryKey: ['categories'],
			});

			setOpen((prev) => !prev);
		},
		onError: (e) => {
			toast.error(`Algo deu errado: ${e.message}`, {
				id: 'create-category',
			});
		},
	});

	const onSubmit = useCallback(
		(values: createCategorySchemaType) => {
			toast.loading('Criando categoria...', {
				id: 'create-category',
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Criar categoria de <TransactionTitle type={type} />
					</DialogTitle>
					<DialogDescription>Categorias são usadas para agrupar transações</DialogDescription>
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
							render={({ field }) => <EmojiPickerFormItem field={field} iconValue={iconValue} />}
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
						{!isPending && 'Criar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EmojiPickerFormItem({
	iconValue,
	field,
}: {
	iconValue: string;
	field: ControllerRenderProps<
		{
			name: string;
			icon: string;
			type: 'income' | 'expense';
			sharable: boolean;
		},
		'icon'
	>;
}) {
	const hasSpaceToEmoji = useMediaQuery('(min-height: 900px)');
	const theme = useTheme();
	const [open, setOpen] = useState(false);

	return (
		<FormItem>
			<FormLabel>Ícone</FormLabel>
			<FormControl>
				{hasSpaceToEmoji ? (
					<Popover onOpenChange={setOpen} open={open}>
						<PopoverTrigger asChild>
							<Button variant={'outline'} className='h-[100px] w-full'>
								{iconValue ? (
									<div className='flex flex-col items-center gap-2'>
										<span className='text-5xl' role='img'>
											{field.value}
										</span>
										<p className='text-xs text-muted-foreground'>Clique para alterar</p>
									</div>
								) : (
									<div className='flex flex-col items-center gap-2'>
										<CircleOff className='h-[48px] w-[48px]' />
										<p className='text-xs text-muted-foreground'>Clique para selecionar</p>
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
									setOpen(false);
								}}
							/>
						</PopoverContent>
					</Popover>
				) : (
					<Dialog onOpenChange={setOpen} open={open}>
						<DialogTrigger asChild>
							<Button variant={'outline'} className='h-[100px] w-full'>
								{iconValue ? (
									<div className='flex flex-col items-center gap-2'>
										<span className='text-5xl' role='img'>
											{field.value}
										</span>
										<p className='text-xs text-muted-foreground'>Clique para alterar</p>
									</div>
								) : (
									<div className='flex flex-col items-center gap-2'>
										<CircleOff className='h-[48px] w-[48px]' />
										<p className='text-xs text-muted-foreground'>Clique para selecionar</p>
									</div>
								)}
							</Button>
						</DialogTrigger>
						<DialogContent hideClose className='w-fit p-2'>
							<Picker
								locale='pt'
								data={data}
								theme={theme.resolvedTheme}
								onEmojiSelect={(emoji: { native: string }) => {
									field.onChange(emoji.native);
									setOpen(false);
								}}
							/>
						</DialogContent>
					</Dialog>
				)}
			</FormControl>
		</FormItem>
	);
}

export default CreateCategoryDialog;
