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
import { usePathname, useRouter } from 'next/navigation';

const HeaderCommandBox = ({ trigger }: { trigger: ReactNode }) => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

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

	return (
		<CommandDialog trigger={trigger} open={open} onOpenChange={setOpen}>
			<CommandInput placeholder='Digite uma funcionalidade' />
			<CommandList>
				<CommandEmpty>Sem resultados</CommandEmpty>
				<CommandGroup heading='Sugestões'>
					{sideBarLinks
						.filter((sideBarLink) => sideBarLink.route !== pathname)
						.map((sideBarLink, index) => (
							<CommandItem value={sideBarLink.route} onSelect={(value) => router.push(value)} key={index}>
								{sideBarLink.label}
							</CommandItem>
						))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
};

export default HeaderCommandBox;
