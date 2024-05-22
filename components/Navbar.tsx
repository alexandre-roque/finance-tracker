'use client';

import React, { useState } from 'react';
import Logo, { LogoMobile } from '@/components/Logo';
import { ThemeSwitcherButton } from '@/components/ThemeSwitcherButton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sideBarLinks as items } from '@/constants';

const Navbar = () => {
	return (
		<>
			<DesktopNavbar />
			<MobileNavbar />
		</>
	);
};

function MobileNavbar() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className='block border-separate bg-background md:hidden'>
			<nav className='container flex items-center justify-between px-8'>
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant={'ghost'} size={'icon'}>
							<Menu />
						</Button>
					</SheetTrigger>
					<SheetContent className='w-[400px] sm:w-[540px]' side='left'>
						<Logo />
						<div className='flex flex-col gap-1 pt-4'>
							{items.map((item) => (
								<NavbarItem
									key={item.label}
									route={item.route}
									label={item.label}
									clickCallback={() => setIsOpen((prev) => !prev)}
								/>
							))}
						</div>
					</SheetContent>
				</Sheet>
				<div className='flex h-[80px] min-h-[60px] items-center gap-x-4'>
					<LogoMobile />
				</div>
				<div className='flex items-center gap-2'>
					<ThemeSwitcherButton />
				</div>
			</nav>
		</div>
	);
}

function DesktopNavbar() {
	return (
		<div className='hidden border-separate border-b bg-background md:block'>
			<nav className='container flex items-center justify-between px-8'>
				<div className='flex h-[80px] min-h-[60px] items-center gap-x-4'>
					<Logo />
					<div className='flex h-full'>
						{items.map((item) => (
							<NavbarItem key={item.label} route={item.route} label={item.label} />
						))}
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<ThemeSwitcherButton />
				</div>
			</nav>
		</div>
	);
}

function NavbarItem({ route, label, clickCallback }: { route: string; label: string; clickCallback?: () => void }) {
	const pathname = usePathname();
	const isActive = pathname === route;

	return (
		<div className='relative flex items-center'>
			<Link
				href={route}
				className={cn(
					buttonVariants({ variant: 'ghost' }),
					'w-full justify-start text-lg text-muted-foreground hover:text-foreground',
					isActive && 'text-foreground'
				)}
				onClick={() => {
					if (clickCallback) clickCallback();
				}}
			>
				{label}
			</Link>
			{isActive && (
				<div className='absolute -bottom-[2px] left-1/2 hidden h-[2px] w-[80%] -translate-x-1/2 rounded-xl bg-foreground md:block' />
			)}
		</div>
	);
}

export default Navbar;
