import React from 'react';
import { ThemeSwitcherButton } from './ThemeSwitcherButton';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Bell, CircleUser, Menu, Search } from 'lucide-react';
import Logo from './Logo';
import { sideBarLinks } from '@/constants';
import Link from 'next/link';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import HeaderCommandBox from './HeaderCommandBox';
import LogoutDropdownItem from './LogoutDropdownItem';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import NotificationsPopOver from './NotificationsPopOver';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const Header = async () => {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	return (
		<header className='flex h-14 items-center justify-between md:justify-end gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6'>
			<Sheet>
				<SheetTrigger asChild>
					<Button variant='outline' size='icon' className='shrink-0 md:hidden'>
						<Menu className='h-5 w-5' />
						<span className='sr-only'>Toggle navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side='left' className='flex flex-col'>
					<nav className='grid gap-2 text-lg font-medium'>
						<div className='flex items-center gap-2'>
							<Logo />
							<p className='bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-3xl font-bold leading-tight tracking-tighter text-transparent'>
								Helper
							</p>
						</div>

						{sideBarLinks.map((sideBarLink, index) => (
							<Link
								key={index}
								href={sideBarLink.route}
								className='mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted'
							>
								{sideBarLink.icon}
								<span>{sideBarLink.label}</span>
							</Link>
						))}
					</nav>
				</SheetContent>
			</Sheet>
			<div className='flex gap-2 items-center'>
				<HeaderCommandBox
					trigger={
						<div className='relative ml-auto flex-1 md:grow-0'>
							<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
							<Button className='text-muted-foreground pl-8' variant='outline'>
								<span>Pesquisar funcionalidades</span>
							</Button>
						</div>
					}
				/>

				<ThemeSwitcherButton />
				<NotificationsPopOver />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='secondary' size='icon' className='rounded-full'>
							<Avatar>
								<AvatarImage src={session.user.image ?? undefined} />
								<AvatarFallback>
									<CircleUser />
								</AvatarFallback>
							</Avatar>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>Minha conta</DropdownMenuLabel>
						<DropdownMenuItem>
							<Link href={'/manage'}>Configurações</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						{session && <LogoutDropdownItem />}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
};

export default Header;
