'use client';

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Currencies, Currency } from '@/lib/currencies';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userSettingsType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { toast } from 'sonner';
import { UpdateUserCurrency } from '@/app/wizard/_actions/userSettings';

const CurrencyComboBox = () => {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<Currency | null>(null);
	const queryClient = useQueryClient();

	const userSettings = useQuery<userSettingsType>({
		queryKey: ['userSettings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	useEffect(() => {
		if (!userSettings.data) return;
		const userCurrency = Currencies.find((currency) => currency.value === userSettings.data.currency);
		if (userCurrency) setSelectedOption(userCurrency);
	}, [userSettings.data]);

	const mutation = useMutation({
		mutationFn: UpdateUserCurrency,
		onSuccess: (data: userSettingsType) => {
			toast.success(`Moeda atualizada com sucesso 🎉`, {
				id: 'update-currency',
			});

			setSelectedOption(Currencies.find((c) => c.value === data.currency) || null);
			queryClient.invalidateQueries({
				queryKey: ['user-settings'],
			});
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado, tente novamente', {
				id: 'update-currency',
			});
		},
	});

	const selectOption = React.useCallback(
		(currency: Currency | null) => {
			if (!currency) {
				toast.error('Selecione uma moeda');
				return;
			}

			if (currency.value !== userSettings.data?.currency) {
				toast.loading('Atualizando moeda...', {
					id: 'update-currency',
				});

				mutation.mutate(currency.value);
			}
		},
		[mutation, userSettings.data?.currency]
	);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={userSettings.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant='outline' className='w-full justify-start' disabled={mutation.isPending}>
							{selectedOption ? <>{selectedOption.label}</> : <>Selecione a moeda</>}
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[200px] p-0' align='start'>
						<OptionList setOpen={setOpen} setSelectedOption={selectOption} />
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={userSettings.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant='outline' className='w-full justify-start' disabled={mutation.isPending}>
						{selectedOption ? <>{selectedOption.label}</> : <>Set currency</>}
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 border-t'>
						<OptionList setOpen={setOpen} setSelectedOption={selectOption} />
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
};

function OptionList({
	setOpen,
	setSelectedOption,
}: {
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: Currency | null) => void;
}) {
	return (
		<Command>
			<CommandInput placeholder='Filtre as moedas...' />
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
					{Currencies.map((currency: Currency) => (
						<CommandItem
							key={currency.value}
							value={currency.value}
							onSelect={(value) => {
								setSelectedOption(Currencies.find((priority) => priority.value === value) || null);
								setOpen(false);
							}}
						>
							{currency.label}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export default CurrencyComboBox;
