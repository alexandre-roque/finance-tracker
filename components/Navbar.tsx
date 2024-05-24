import Link from 'next/link';
import { Bell, CircleUser, Home, LineChart, Menu, Package, Package2, Search, ShoppingCart, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from './Logo';
import { sideBarLinks } from '@/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ThemeSwitcherButton } from './ThemeSwitcherButton';
import Header from './Header';

const Navbar = () => {
	return (
		<div className='hidden border-r bg-muted/40 md:block'>
			<div className='flex h-full max-h-screen flex-col gap-2'>
				<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
					<Logo />
				</div>
				<nav className='grid gap-2 items-start px-2 text-sm font-medium lg:px-4'>
					<TooltipProvider>
						{sideBarLinks.map((sideBarLink, index) => (
							<Tooltip key={index}>
								<TooltipTrigger>
									<Link
										href={sideBarLink.route}
										className='flex items-center gap-3 rounded-lg pl-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted'
									>
										{sideBarLink.icon}
										<span className='hidden lg:block'>{sideBarLink.label}</span>
										<div className='block lg:hidden'>
											<TooltipContent sideOffset={3} side='right'>
												<span>{sideBarLink.label}</span>
											</TooltipContent>
										</div>
									</Link>
								</TooltipTrigger>
							</Tooltip>
						))}
					</TooltipProvider>
				</nav>
			</div>
		</div>
	);
};

export default Navbar;
