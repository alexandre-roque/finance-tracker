'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionType, cn } from '@/lib/utils';
import { UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { categoriesType as Category, userSettingsType } from '@/db/schema/finance';
import CreateCategoryDialog from './CreateCategoryDialog';
import { toast } from 'sonner';
import { UpdateUserCategory } from '@/app/wizard/_actions/userSettings';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer';
import SkeletonWrapper from '../common/SkeletonWrapper';
import Link from 'next/link';
import { Separator } from '../ui/separator';

interface Props {
	type: TransactionType;
	resetPing?: boolean;
	onChange?: (value: string) => void;
	isConfiguring?: boolean;
	userSettings?: userSettingsType;
	firstSelectedValue?: string | null;
	isTeamSelected?: boolean;
}

function CategoryPicker({
	type,
	onChange,
	isConfiguring,
	userSettings,
	firstSelectedValue,
	isTeamSelected,
	resetPing,
}: Props) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(
		firstSelectedValue
			? firstSelectedValue
			: type === 'income'
			? userSettings?.mainIncomeCategory ?? ''
			: userSettings?.mainExpenseCategory ?? ''
	);

	const [label, setLabel] = useState('');
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const queryClient = useQueryClient();

	const categoriesQuery = useQuery({
		queryKey: ['categories', type],
		queryFn: () => fetch(`/api/categories?type=${type}`).then((res) => res.json()),
	});

	const { mutate } = useMutation({
		mutationFn: UpdateUserCategory,
		onSuccess: (data: userSettingsType) => {
			toast.success('Categoria padrão atualizada com sucesso 🎉', {
				id: 'update-category',
			});
			const cCategory = categoriesQuery.data?.find(
				(category: Category) =>
					category.id === (type === 'income' ? data.mainIncomeCategory : data.mainExpenseCategory)
			);
			setValue(cCategory?.id);
			queryClient.invalidateQueries({
				predicate: (query) => query.queryKey[0] === 'user-settings' && !query.queryKey[1],
			});
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado, tente novamente', {
				id: 'update-category',
			});
		},
	});

	useEffect(() => {
		if (!value) return;
		if (onChange) onChange(value);
	}, [onChange, value]);

	useEffect(() => {
		setValue(
			type === 'income'
				? userSettings?.mainIncomeCategory ?? firstSelectedValue ?? ''
				: userSettings?.mainExpenseCategory ?? firstSelectedValue ?? ''
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userSettings]);

	const handleConfiguring = useCallback(
		(categoryId: string) => {
			if (isConfiguring) {
				mutate({ categoryId, type });
			}
		},
		[isConfiguring, mutate, type]
	);

	const successCallback = useCallback(
		(category: Category) => {
			setValue(category.id);
			setLabel(category.name);
			setOpen((prev) => !prev);
		},
		[setValue, setOpen]
	);

	const selectedCategory = categoriesQuery.data?.find((category: Category) =>
		isTeamSelected ? category.id === value && category.sharable : category.id === value
	);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={categoriesQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant={'outline'}
							role='combobox'
							aria-expanded={open}
							className='w-full justify-between'
						>
							{selectedCategory ? <CategoryRow category={selectedCategory} /> : 'Selecionar categoria'}
							<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent align='start' className='w-full p-0'>
						<OptionsList
							isConfiguring={isConfiguring}
							type={type}
							successCallback={successCallback}
							categoriesQuery={categoriesQuery}
							isTeamSelected={isTeamSelected}
							onSelect={(category) => {
								handleConfiguring(category?.id || '');
								setValue(category?.id || '');
								setLabel(category?.name || '');
								setOpen((prev) => !prev);
							}}
							value={value}
							label={label}
						/>
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={categoriesQuery.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant={'outline'} role='combobox' aria-expanded={open} className='w-full justify-between'>
						{selectedCategory ? <CategoryRow category={selectedCategory} /> : 'Selecionar categoria'}
						<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 mb-20 border-t'>
						<OptionsList
							isConfiguring={isConfiguring}
							type={type}
							successCallback={successCallback}
							categoriesQuery={categoriesQuery}
							onSelect={(category) => {
								handleConfiguring(category?.id || '');
								setValue(category?.id || '');
								setOpen((prev) => !prev);
								setLabel(category?.name || '');
							}}
							value={value}
							label={label}
						/>
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
}

function OptionsList({
	isConfiguring,
	type,
	successCallback,
	categoriesQuery,
	onSelect,
	value,
	label,
	isTeamSelected,
}: {
	isConfiguring?: boolean;
	type: TransactionType;
	successCallback: (category: Category) => void;
	categoriesQuery: UseQueryResult<any, Error>;
	onSelect: (category: Category | null) => void;
	label: string;
	value: string;
	isTeamSelected?: boolean;
}) {
	let categories = categoriesQuery.data || [];
	if (isTeamSelected) {
		categories = categories.filter((category: Category) => category.sharable);
	}

	return (
		<Command
			onSubmit={(e) => {
				e.preventDefault();
			}}
		>
			<CommandInput placeholder='Pesquisar categorias...' />
			<CreateCategoryDialog type={type} successCallback={successCallback} />
			{isConfiguring && (!categoriesQuery.data || !categoriesQuery.data.length) && (
				<p className='text-xs text-muted-foreground mt-1 text-center md:max-w-[243px] p-2'>
					Dica: Crie uma nova categoria, por exemplo:
					{type === 'income'
						? ' Salário, pensão, herança, PL ou dinheiro do velho rico'
						: ' Mercado, transporte, aluguel, lazer ou RP'}{' '}
				</p>
			)}
			<CommandEmpty>
				<p>Não encontrada</p>
				<p className='text-xs text-muted-foreground mt-1 text-center lg:max-w-[243px] p-2'>
					Dica: Crie uma nova categoria, por exemplo:
					{type === 'income'
						? ' Salário, pensão, herança, PL ou dinheiro do velho rico'
						: ' Mercado, transporte, aluguel, lazer ou RP'}{' '}
				</p>
			</CommandEmpty>
			<CommandGroup>
				<CommandList>
					{isConfiguring && (
						<CommandItem
							className='justify-between'
							onSelect={() => {
								onSelect(null);
							}}
						>
							Nenhuma categoria padrão
							<Check className={cn('mr-2 w-4 h-4 opacity-0', !value && 'opacity-100')} />
						</CommandItem>
					)}
					{categories.map((category: Category) => (
						<CommandItem className='justify-between' key={category.id} onSelect={() => onSelect(category)}>
							<CategoryRow category={category} />
							<Check className={cn('mr-2 w-4 h-4 opacity-0', value === category.id && 'opacity-100')} />
						</CommandItem>
					))}
				</CommandList>
			</CommandGroup>

			<Separator />

			<p className='text-xs text-muted-foreground text-center lg:max-w-[243px] p-2'>
				Você pode configurar uma padrão nas{' '}
				<Link className='underline text-blue-500' href='/manage'>
					configurações
				</Link>
			</p>
		</Command>
	);
}

export default CategoryPicker;

function CategoryRow({ category }: { category: Category }) {
	return (
		<div className='flex items-center gap-2 mr-2'>
			<span role='img'>{category.icon}</span>
			<span>{category.name}</span>
		</div>
	);
}
