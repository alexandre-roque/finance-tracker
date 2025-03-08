'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { macroType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { Check, ChevronsUpDown, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditMacroDialog from './CreateOrEditMacroDialog';

interface Props {
	onChange?: (selectedOption: macroType) => void;
	small?: boolean;
}

const MacroComboBox = ({ onChange, small }: Props) => {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<macroType | null>(null);

	const macrosQuery = useQuery<macroType[]>({
		queryKey: ['macros'],
		queryFn: () => fetch('/api/macros').then((res) => res.json()),
	});

	const selectOption = useCallback((macro: macroType | null) => {
		setSelectedOption(macro);
	}, []);

	useEffect(() => {
		if (selectedOption) {
			if (onChange) {
				onChange(selectedOption);
			}
		}
	}, [onChange, selectedOption]);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={macrosQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant='outline' className='w-full justify-between'>
							{small ? 'M' : selectedOption ? <>{selectedOption.name}</> : <>Selecionar macro</>}
							<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[200px] p-0' align='start'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							macros={macrosQuery.data}
							selectedOption={selectedOption}
						/>
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={macrosQuery.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant='outline' className='w-full justify-between'>
						{small ? 'M' : selectedOption ? <>{selectedOption.name}</> : <>Selecionar macro</>}
						<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 border-t'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							macros={macrosQuery.data}
							selectedOption={selectedOption}
						/>
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
};

function OptionList({
	macros,
	setOpen,
	setSelectedOption,
	selectedOption,
}: {
	macros?: macroType[];
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: macroType | null) => void;
	selectedOption?: macroType | null;
}) {
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	return (
		<Command>
			<CommandInput placeholder='Pesquisar macros...' />
			<EditMacroDialog open={createDialogOpen} setOpen={setCreateDialogOpen} />
			<Button
				variant={'ghost'}
				className='flex border-separate items-center justify-start roudned-none border-b px-3 py-3 text-muted-foreground'
				onClick={() => setCreateDialogOpen(true)}
			>
				<PlusSquare className='mr-2 h-4 w-4' />
				Criar novo
			</Button>
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
					{macros?.map((macro) => (
						<CommandItem
							className='justify-between'
							key={macro.id}
							value={macro.id || ''}
							onSelect={(value) => {
								setSelectedOption(macros.find((macro) => macro.id === value) || null);
								setOpen(false);
							}}
						>
							{macro.name}
							<Check
								className={cn(
									'mr-2 w-4 h-4 opacity-0',
									selectedOption?.id === macro.id && 'opacity-100'
								)}
							/>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export default MacroComboBox;
