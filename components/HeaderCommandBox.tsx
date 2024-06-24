'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { sideBarLinks } from '@/constants';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CreateTransactionDialog from './CreateTransactionDialog';
import { Frown, Smile, SquareStack } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const HeaderCommandBox = ({ trigger }: { trigger: ReactNode }) => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const userSettingsQuery = useQuery({
		queryKey: ['user-settings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const [openedActions, setOpenedActions] = useState({
		income: false,
		expense: false,
	});

	useEffect(() => {
		if (!open) {
			setOpenedActions({
				income: false,
				expense: false,
			});
		}
	}, [open]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	const searchParams = useSearchParams();

	return (
		<CommandDialog trigger={trigger} open={open} onOpenChange={setOpen}>
			<CommandInput placeholder='Digite uma funcionalidade' />
			<CommandList>
				<CommandEmpty>Sem resultados</CommandEmpty>
				<CommandGroup heading='Ações'>
					<CommandItem
						onSelect={() =>
							setOpenedActions({
								income: false,
								expense: true,
							})
						}
						className='flex items-center gap-2'
					>
						<CreateTransactionDialog
							isSelected={openedActions['expense']}
							type='expense'
							trigger={
								<div className='flex items-center gap-2 w-full'>
									<Frown />
									Nova despesa
								</div>
							}
						/>
					</CommandItem>
					<CommandItem
						onSelect={() =>
							setOpenedActions({
								income: true,
								expense: false,
							})
						}
						className='flex items-center gap-2'
					>
						<CreateTransactionDialog
							isSelected={openedActions['income']}
							type='income'
							trigger={
								<div className='flex items-center gap-2 w-full'>
									<Smile />
									Nova receita
								</div>
							}
						/>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							router.push('/expenses-table');
							setOpen(false);
						}}
						className='flex items-center gap-2'
					>
						<SquareStack />
						Despesas em lote
					</CommandItem>
				</CommandGroup>
				<CommandGroup heading='Links'>
					{sideBarLinks
						.filter((sideBarLink) => sideBarLink.route !== pathname)
						.map((sideBarLink, index) => (
							<CommandItem
								className='flex items-center gap-2'
								value={`${sideBarLink.route}?${searchParams.toString()}`}
								onSelect={(value) => {
									router.push(value);
									setOpen(false);
								}}
								key={index}
							>
								{sideBarLink.icon}
								{sideBarLink.label}
							</CommandItem>
						))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
};

export default HeaderCommandBox;
