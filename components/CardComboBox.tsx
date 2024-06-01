'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsType, userSettingsType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { toast } from 'sonner';
import { UpdateUserCard } from '@/app/wizard/_actions/userSettings';
import { ChevronsUpDown, Plus } from 'lucide-react';
import CardCreationDialog from './CardCreationDialog';

interface Props {
	onChange?: (value: string) => void;
	isConfiguring?: boolean;
	userSettings?: userSettingsType;
	firstSelectedValue?: string | null;
}

const CardComboBox = ({ userSettings, onChange, isConfiguring, firstSelectedValue }: Props) => {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<cardsType | null>(null);
	const queryClient = useQueryClient();

	const cardsQuery = useQuery<cardsType[]>({
		queryKey: ['cards'],
		queryFn: () => fetch('/api/cards').then((res) => res.json()),
	});

	const mutation = useMutation({
		mutationFn: UpdateUserCard,
		onSuccess: (data: userSettingsType) => {
			toast.success('Cartão principal configurado com sucesso 🎉', {
				id: 'update-card',
			});

			setSelectedOption(cardsQuery.data?.find((c) => c.id === data.mainCard) || null);
			queryClient.invalidateQueries({
				queryKey: ['user-settings'],
			});
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado', {
				id: 'update-card',
			});
		},
	});

	const selectOption = useCallback(
		(card: cardsType | null) => {
			if (isConfiguring) {
				if (!card) {
					toast.loading('Retirando cartão...', {
						id: 'update-card',
					});
				} else {
					toast.loading('Configurando cartão...', {
						id: 'update-card',
					});
				}

				toast.loading('Configurando cartão...', {
					id: 'update-card',
				});

				mutation.mutate(card?.id ?? null);
			} else {
				setSelectedOption(card);
			}
		},
		[mutation, isConfiguring]
	);

	useEffect(() => {
		if (!userSettings) return;
		if (!cardsQuery.data) return;
		const currentCard = cardsQuery.data.find((card) => card.id === userSettings.mainCard);
		if (currentCard) setSelectedOption(currentCard);
	}, [cardsQuery.data, userSettings]);

	useEffect(() => {
		if (!firstSelectedValue) return;
		if (!cardsQuery.data) return;
		const currentCard = cardsQuery.data.find((card) => card.id === firstSelectedValue);
		if (currentCard) setSelectedOption(currentCard);
	}, [cardsQuery.data, firstSelectedValue]);

	useEffect(() => {
		if (!selectedOption) return;
		if (onChange) onChange(selectedOption.id);
	}, [onChange, selectedOption]);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={cardsQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant='outline' className='w-full justify-between' disabled={mutation.isPending}>
							{selectedOption ? <>{selectedOption.name}</> : <>Selecionar cartão</>}
							<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[200px] p-0' align='start'>
						<OptionList setOpen={setOpen} setSelectedOption={selectOption} cards={cardsQuery.data} />
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={cardsQuery.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant='outline' className='w-full justify-between' disabled={mutation.isPending}>
						{selectedOption ? <>{selectedOption.name}</> : <>Selecionar cartão</>}
						<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 border-t'>
						<OptionList setOpen={setOpen} setSelectedOption={selectOption} cards={cardsQuery.data} />
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
};

function OptionList({
	cards,
	setOpen,
	setSelectedOption,
}: {
	cards?: cardsType[];
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: cardsType | null) => void;
}) {
	return (
		<Command>
			<CommandInput placeholder='Filtrar cartões...' />
			<CardCreationDialog />
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
					<CommandItem
						onSelect={() => {
							setSelectedOption(null);
							setOpen(false);
						}}
					>
						Nenhum cartão
					</CommandItem>
					{cards?.map((card) => (
						<CommandItem
							key={card.id}
							value={card.id || ''}
							onSelect={(value) => {
								setSelectedOption(cards.find((card) => card.id === value) || null);
								setOpen(false);
							}}
						>
							{card.name} {card.number}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export default CardComboBox;
