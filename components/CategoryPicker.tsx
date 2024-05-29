'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionType, cn } from '@/lib/utils';
import { UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { categoriesType as Category, UserSettingsType } from '@/db/schema/finance';
import CreateCategoryDialog from './CreateCategoryDialog';
import { toast } from 'sonner';
import { UpdateUserCategory } from '@/app/wizard/_actions/userSettings';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Drawer, DrawerContent, DrawerTrigger } from './ui/drawer';
import SkeletonWrapper from './SkeletonWrapper';

interface Props {
	type: TransactionType;
	onChange?: (value: string) => void;
	isConfiguring?: boolean;
	userSettings?: UserSettingsType;
}

function CategoryPicker({ type, onChange, isConfiguring, userSettings }: Props) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(
		type === 'income' ? userSettings?.mainIncomeCategory ?? '' : userSettings?.mainExpenseCategory ?? ''
	);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const queryClient = useQueryClient();

	const categoriesQuery = useQuery({
		queryKey: ['categories', type],
		queryFn: () =>
			fetch('/api/categories', {
				method: 'POST',
				body: JSON.stringify({
					type,
				}),
			}).then((res) => res.json()),
	});

	const { mutate } = useMutation({
		mutationFn: UpdateUserCategory,
		onSuccess: (data: UserSettingsType) => {
			toast.success('Categoria padrão atualizada com sucesso 🎉', {
				id: 'update-category',
			});
			const cCategory = categoriesQuery.data?.find(
				(category: Category) =>
					category.name === (type === 'income' ? data.mainIncomeCategory : data.mainExpenseCategory)
			);
			setValue(cCategory?.name);
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

	const handleConfiguring = useCallback(
		(categoryName: string) => {
			if (isConfiguring) {
				mutate({ categoryId: categoryName, type });
			}
		},
		[isConfiguring, mutate, type]
	);

	const selectedCategory = categoriesQuery.data?.find((category: Category) => category.name === value);

	const successCallback = useCallback(
		(category: Category) => {
			setValue(category.name);
			setOpen((prev) => !prev);
		},
		[setValue, setOpen]
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
							onSelect={(category) => {
								handleConfiguring(category?.name || '');
								setValue(category?.name || '');
								setOpen((prev) => !prev);
							}}
							value={value}
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
								handleConfiguring(category?.name || '');
								setValue(category?.name || '');
								setOpen((prev) => !prev);
							}}
							value={value}
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
}: {
	isConfiguring?: boolean;
	type: TransactionType;
	successCallback: (category: Category) => void;
	categoriesQuery: UseQueryResult<any, Error>;
	onSelect: (category: Category | null) => void;
	value: string;
}) {
	return (
		<Command
			onSubmit={(e) => {
				e.preventDefault();
			}}
		>
			<CommandInput placeholder='Pesquisar categoria...' />
			<CreateCategoryDialog type={type} successCallback={successCallback} />
			<CommandEmpty>
				<p>Não encontrada</p>
				<p className='text-xs text-muted-foreground mt-1'>Dica: Cria uma nova categoria</p>
			</CommandEmpty>
			<CommandGroup>
				<CommandList>
					{isConfiguring && (
						<CommandItem
							onSelect={() => {
								onSelect(null);
							}}
						>
							Nenhuma categoria padrão
						</CommandItem>
					)}
					{categoriesQuery.data &&
						categoriesQuery.data.map((category: Category) => (
							<CommandItem key={category.name} onSelect={() => onSelect(category)}>
								<CategoryRow category={category} />
								<Check
									className={cn('mr-2 w-4 h-4 opacity-0', value === category.name && 'opacity-100')}
								/>
							</CommandItem>
						))}
				</CommandList>
			</CommandGroup>
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
