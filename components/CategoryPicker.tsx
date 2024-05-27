'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TransactionType, cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { categoriesType as Category, UserSettingsType } from '@/db/schema/finance';
import CreateCategoryDialog from './CreateCategoryDialog';
import { toast } from 'sonner';
import { UpdateUserCategory } from '@/app/wizard/_actions/userSettings';

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
			toast.success(`Categoria atualizada com sucesso 🎉`, {
				id: 'update-expense',
			});

			setValue(
				categoriesQuery.data?.find(
					(category: Category) =>
						category.name === (type === 'income' ? data.mainIncomeCategory : data.mainExpenseCategory)
				).name
			);
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado, tente novamente', {
				id: 'update-expense',
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

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant={'outline'} role='combobox' aria-expanded={open} className='w-full justify-between'>
					{selectedCategory ? <CategoryRow category={selectedCategory} /> : 'Selecionar categoria'}
					<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-full p-0'>
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
							{categoriesQuery.data &&
								categoriesQuery.data.map((category: Category) => (
									<CommandItem
										key={category.name}
										onSelect={() => {
											handleConfiguring(category.name);
											setValue(category.name);
											setOpen((prev) => !prev);
										}}
									>
										<CategoryRow category={category} />
										<Check
											className={cn(
												'mr-2 w-4 h-4 opacity-0',
												value === category.name && 'opacity-100'
											)}
										/>
									</CommandItem>
								))}
						</CommandList>
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
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
