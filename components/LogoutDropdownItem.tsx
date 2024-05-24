'use client';

import React from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { signOut } from '@/auth';

const LogoutDropdownItem = () => {
	return <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>;
};

export default LogoutDropdownItem;
