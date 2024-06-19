import Logo from './Logo';
import { sideBarLinks } from '@/constants';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import SideBarLinkComponent from './SideBarLinkComponent';

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
									<SideBarLinkComponent
										key={index}
										sideBarLink={sideBarLink}
										index={index}
										where='navbar'
									/>
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
