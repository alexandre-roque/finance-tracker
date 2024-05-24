import { CreditCard, Home, LineChart, Settings } from 'lucide-react';

export const sideBarLinks = [
	{ label: 'Dashboard', route: '/', icon: <Home /> },
	{ label: 'Transações', route: '/transactions', icon: <CreditCard /> },
	{ label: 'Analytics', route: '/analytics', icon: <LineChart /> },
	{ label: 'Gerenciar', route: '/manage', icon: <Settings /> },
];
