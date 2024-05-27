'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CardsType, UserSettingsType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { toast } from 'sonner';
import { UpdateUserCard } from '@/app/wizard/_actions/userSettings';
import { Plus } from 'lucide-react';
import CardCreationDialog from './CardCreationDialog';

interface Props {
	onChange?: (value: string) => void;
	isConfiguring?: boolean;
	userSettings?: UserSettingsType;
}

const CardComboBox = ({ userSettings, onChange, isConfiguring }: Props) => {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<CardsType | null>(null);

	const cardsQuery = useQuery<CardsType[]>({
		queryKey: ['cards'],
		queryFn: () => fetch('/api/cards').then((res) => res.json()),
	});

	const mutation = useMutation({
		mutationFn: UpdateUserCard,
		onSuccess: (data: UserSettingsType) => {
			toast.success(`Cartão principal selecionado com sucesso 🎉`, {
				id: 'update-card',
			});

			setSelectedOption(cardsQuery.data?.find((c) => c.id === data.mainCard) || null);
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado', {
				id: 'update-card',
			});
		},
	});

	const selectOption = useCallback(
		(card: CardsType | null) => {
			if (isConfiguring) {
				if (!card) {
					toast.error('Selecione um cartão');
					return;
				}

				toast.loading('Configurando cartão...', {
					id: 'update-card',
				});

				mutation.mutate(card.id);
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
		if (!selectedOption) return;
		if (onChange) onChange(selectedOption.id);
	}, [onChange, selectedOption]);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={cardsQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<div className='flex'>
						<PopoverTrigger asChild>
							<Button variant='outline' className='w-full justify-start' disabled={mutation.isPending}>
								{selectedOption ? <>{selectedOption.name}</> : <>Selecionar cartão</>}
							</Button>
						</PopoverTrigger>
						<CardCreationDialog
							trigger={
								<Button size='icon' variant='outline' className='grid-auto'>
									<Plus />
								</Button>
							}
						/>
					</div>
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
					<Button variant='outline' className='w-full justify-start' disabled={mutation.isPending}>
						{selectedOption ? <>{selectedOption.name}</> : <>Selecionar cartão</>}
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
	cards?: CardsType[];
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: CardsType | null) => void;
}) {
	return (
		<Command>
			<CommandInput placeholder='Filtrar cartões...' />
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
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
