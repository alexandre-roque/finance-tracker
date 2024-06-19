'use client';

import Link from 'next/link';
import { TooltipContent } from './ui/tooltip';
import { useSearchParams } from 'next/navigation';

const SideBarLinkComponent = ({
    sideBarLink,
    where,
    index,
}: {
    sideBarLink: {
        label: string;
        route: string;
        icon: JSX.Element;
    };
    where: string;
    index: number;
}) => {
    const searchParams = useSearchParams();
    const route = `${sideBarLink.route}?${searchParams.toString()}`;

    if (where === 'header') {
        return (
            <Link
                key={index}
                href={route}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
                {sideBarLink.icon}
                <span>{sideBarLink.label}</span>
            </Link>
        );
    } else if (where === 'navbar') {
        return (
            <Link
                href={route}
                className="flex items-center gap-3 rounded-lg pl-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
                {sideBarLink.icon}
                <span className="hidden lg:block">{sideBarLink.label}</span>
                <div className="block lg:hidden">
                    <TooltipContent sideOffset={3} side="right">
                        <span>{sideBarLink.label}</span>
                    </TooltipContent>
                </div>
            </Link>
        );
    }
};

export default SideBarLinkComponent;
