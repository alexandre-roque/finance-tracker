'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userSettingsType } from '@/db/schema/finance';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { toast } from 'sonner';
import { UpdateUserTeam } from '@/app/wizard/_actions/userSettings';
import { Check, ChevronsUpDown } from 'lucide-react';
import CreateTeamDialog from './CreateTeamDialog';
import { cn } from '@/lib/utils';

interface Props {
	onChange?: (value?: string) => void;
	isConfiguring?: boolean;
	userSettings?: userSettingsType;
	firstSelectedValue?: string | null;
}

export type teamsQueryType = {
	id: string;
	userId: string;
	teamId: string;
	role: string;
	status: string;
	team: {
		id: string;
		name: string;
		description: string | null;
		ownerId: string;
		hideOnLandingPage: boolean;
	};
};

const TeamsComboBox = ({ userSettings, onChange, isConfiguring, firstSelectedValue }: Props) => {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [selectedOption, setSelectedOption] = useState<teamsQueryType | null>(null);
	const queryClient = useQueryClient();

	const teamsQuery = useQuery<teamsQueryType[]>({
		queryKey: ['teams-members'],
		queryFn: () => fetch('/api/teams').then((res) => res.json()),
	});

	const mutation = useMutation({
		mutationFn: UpdateUserTeam,
		onSuccess: (data: userSettingsType) => {
			toast.success('Time principal configurado com sucesso 🎉', {
				id: 'update-team',
			});

			setSelectedOption(teamsQuery.data?.find((t) => t.team.id === data.mainTeam) || null);
			queryClient.invalidateQueries({
				queryKey: ['user-settings'],
			});
		},
		onError: (e) => {
			console.error(e);
			toast.error('Algo deu errado', {
				id: 'update-team',
			});
		},
	});

	const selectOption = useCallback(
		(team: teamsQueryType | null) => {
			if (isConfiguring) {
				if (!team) {
					toast.loading('Retirando time...', {
						id: 'update-team',
					});
				} else {
					toast.loading('Configurando time padrão...', {
						id: 'update-team',
					});
				}

				mutation.mutate(team?.team.id ?? null);
			} else {
				setSelectedOption(team);
			}
		},
		[mutation, isConfiguring]
	);

	useEffect(() => {
		if (!userSettings) return;
		if (!teamsQuery.data) return;
		const currentTeam = teamsQuery.data.find((teamMember) => teamMember.team.id === userSettings.mainTeam);
		if (currentTeam) setSelectedOption(currentTeam);
	}, [teamsQuery.data, userSettings]);

	useEffect(() => {
		if (!firstSelectedValue) return;
		if (!teamsQuery.data) return;
		const currentTeam = teamsQuery.data.find((teamMember) => teamMember.team.id === firstSelectedValue);
		if (currentTeam) setSelectedOption(currentTeam);
	}, [teamsQuery.data, firstSelectedValue]);

	useEffect(() => {
		if (onChange) onChange(selectedOption?.team?.id);
	}, [onChange, selectedOption]);

	if (isDesktop) {
		return (
			<SkeletonWrapper isLoading={teamsQuery.isFetching}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant='outline'
							className='w-full justify-between h-11 gap-3'
							disabled={mutation.isPending}
						>
							{selectedOption ? <>{selectedOption.team.name}</> : <>Selecionar time</>}
							<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[200px] p-0' align='start'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							teams={teamsQuery.data}
							selectedOption={selectedOption}
						/>
					</PopoverContent>
				</Popover>
			</SkeletonWrapper>
		);
	}

	return (
		<SkeletonWrapper isLoading={teamsQuery.isFetching}>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant='outline' className='w-full justify-between' disabled={mutation.isPending}>
						{selectedOption ? <>{selectedOption.team.name}</> : <>Selecionar time</>}
						<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<div className='mt-4 border-t'>
						<OptionList
							setOpen={setOpen}
							setSelectedOption={selectOption}
							teams={teamsQuery.data}
							selectedOption={selectedOption}
						/>
					</div>
				</DrawerContent>
			</Drawer>
		</SkeletonWrapper>
	);
};

function OptionList({
	teams,
	setOpen,
	setSelectedOption,
	selectedOption,
}: {
	teams?: teamsQueryType[];
	setOpen: (open: boolean) => void;
	setSelectedOption: (status: teamsQueryType | null) => void;
	selectedOption?: teamsQueryType | null;
}) {
	return (
		<Command>
			<CommandInput placeholder='Pesquisar times...' />
			<CreateTeamDialog />
			{(!teams || !teams.length) && (
				<>
					<p className='text-xs text-muted-foreground mt-1 text-center md:max-w-[243px] p-2'>
						Dica: Crie um novo time, por exemplo: Casa.
					</p>
					<p className='text-xs text-muted-foreground mt-1 text-center md:max-w-[243px] p-2'>
						Isso irá te ajudar a agrupar suas despesas e receitas. Além de conseguir dividir suas contas e
						compatilhar o que cadastrou com outras pessoas.
					</p>
					<p className='text-xs text-muted-foreground mt-1 text-center md:max-w-[243px] p-2'>
						Para convidar alguém para o seu time, basta clicar na aba Times no canto esquerdo
					</p>
				</>
			)}
			<CommandList>
				<CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
				<CommandGroup>
					<CommandItem
						className='justify-between'
						onSelect={() => {
							setSelectedOption(null);
							setOpen(false);
						}}
					>
						Nenhum time
						<Check className={cn('mr-2 w-4 h-4 opacity-0', !selectedOption && 'opacity-100')} />
					</CommandItem>
					{teams?.map((team) => (
						<CommandItem
							className='justify-between'
							key={team.id}
							value={team.id || ''}
							onSelect={(value) => {
								setSelectedOption(teams.find((team) => team.id === value) || null);
								setOpen(false);
							}}
						>
							{team.team.name}
							<Check
								className={cn(
									'mr-2 w-4 h-4 opacity-0',
									selectedOption?.id === team.id && 'opacity-100'
								)}
							/>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export default TeamsComboBox;
