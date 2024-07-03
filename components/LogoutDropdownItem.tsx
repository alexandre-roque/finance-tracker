'use client';

import React from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';

const LogoutDropdownItem = () => {
	const router = useRouter();
	return <DropdownMenuItem onClick={() => router.push('/api/auth/signout')}>Sair</DropdownMenuItem>;
};

export default LogoutDropdownItem;
