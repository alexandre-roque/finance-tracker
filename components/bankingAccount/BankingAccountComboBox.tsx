'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bankingAccountsType, userSettingsType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { toast } from 'sonner';
import { UpdateUserBankingAccount } from '@/app/wizard/_actions/userSettings';
import { Check, ChevronsUpDown } from 'lucide-react';
import CreateBankingAccountDialog from './CreateBankingAccountDialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Separator } from '../ui/separator';

interface Props {
	onChange?: (value: string) => void;
	isConfiguring?: boolean;
	userSettings?: userSettingsType;
	firstSelectedValue?: string | null;
}

const BankingAccountComboBox = ({ userSettings, onChange, isConfiguring, firstSelectedValue }: Props) => {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<bankingAccountsType | null>(null);
	const queryClient = useQueryClient();

	const bankingAccountsQuery = useQuery<bankingAccountsType[]>({
		queryKey: ['banking-accounts'],
		queryFn: () => fetch('/api/banking-accounts').then((res) => res.json()),
	});

	const mutation = useMutation({
		mutationFn: UpdateUserBankingAccount,
		onSuccess: (data: userSettingsType) => {
			toast.success('Conta bancária principal configurada com sucesso 🎉', {
				id: 'update-bankingAccount',
			});

			setSelectedOption(bankingAccountsQuery.data?.find((c) => c.id === data.mainBankingAccount) || null);

			queryClient.invalidateQueries({
				queryKey: ['user-settings'],
			});
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado', {
				id: 'update-bankingAccount',
			});
		},
	});

	const selectOption = useCallback(
		(bankingAccountId: bankingAccountsType | null) => {
			if (isConfiguring) {
				if (!bankingAccountId) {
					toast.loading('Retirando conta bancária...', {
						id: 'update-bankingAccount',
					});
				} else {
					toast.loading('Configurando conta bancária...', {
						id: 'update-bankingAccount',
					});
				}

				toast.loading('Configurando conta bancária...', {
					id: 'update-bankingAccount',
				});

				mutation.mutate(bankingAccountId?.id ?? null);
			} else {
				setSelectedOption(bankingAccountId);
			}
		},
		[mutation, isConfiguring]
	);

	useEffect(() => {
		if (!userSettings) return;
		if (!bankingAccountsQuery.data) return;
		const currentBankingAccount = bankingAccountsQuery.data.find(
			(bankingAccount) => bankingAccount.id === userSettings.mainBankingAccount
		);
		if (currentBankingAccount) setSelectedOption(currentBankingAccount);
	}, [bankingAccountsQuery.data, userSettings]);

	useEffect(() => {
		if (!firstSelectedValue) return;
		if (!bankingAccountsQuery.data) return;
		const currentBankingAccount = bankingAccountsQuery.data.find(
			(bankingAccount) => bankingAccount.id === firstSelectedValue
		);
		if (currentBankingAccount) setSelectedOption(currentBankingAccount);
	}, [bankingAccountsQuery.data, firstSelectedValue]);

	useEffect(() => {
		if (selectedOption) {
			if (onChange) onChange(selectedOption.id);
		}
	}, [onChange, selectedOption]);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={bankingAccountsQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant='outline' className='w-full justify-between' disabled={mutation.isPending}>
							{selectedOption ? <>{selectedOption.name}</> : <>Selecionar conta</>}
							<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[200px] p-0' align='start'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							bankingAccounts={bankingAccountsQuery.data}
							selectedOption={selectedOption}
						/>
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={bankingAccountsQuery.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant='outline' className='w-full justify-between' disabled={mutation.isPending}>
						{selectedOption ? <>{selectedOption.name}</> : <>Selecionar conta</>}
						<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 border-t'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							bankingAccounts={bankingAccountsQuery.data}
							selectedOption={selectedOption}
						/>
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
};

function OptionList({
	bankingAccounts,
	setOpen,
	setSelectedOption,
	selectedOption,
}: {
	bankingAccounts?: bankingAccountsType[];
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: bankingAccountsType | null) => void;
	selectedOption?: bankingAccountsType | null;
}) {
	return (
		<Command>
			<CommandInput placeholder='Pesquisar contas...' />
			<CreateBankingAccountDialog />
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
					{bankingAccounts?.map((bankingAccount) => (
						<CommandItem
							className='justify-between'
							key={bankingAccount.id}
							value={bankingAccount.id || ''}
							onSelect={(value) => {
								setSelectedOption(
									bankingAccounts.find((bankingAccount) => bankingAccount.id === value) || null
								);
								setOpen(false);
							}}
						>
							{bankingAccount.name}
							<Check
								className={cn(
									'mr-2 w-4 h-4 opacity-0',
									selectedOption?.id === bankingAccount.id && 'opacity-100'
								)}
							/>
						</CommandItem>
					))}
				</CommandGroup>

				<Separator />

				<p className='text-xs text-muted-foreground text-center lg:max-w-[243px] p-2'>
					Você pode configurar uma padrão nas{' '}
					<Link className='underline text-blue-500' href='/manage'>
						configurações
					</Link>
				</p>
			</CommandList>
		</Command>
	);
}

export default BankingAccountComboBox;
