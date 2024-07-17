import { Coffee, CreditCard, HeartHandshake, Home, LineChart, Settings, SquareKanban, Timer } from 'lucide-react';

export const sideBarLinks = [
	{ label: 'Dashboard', route: '/', icon: <Home /> },
	{ label: 'Transações', route: '/transactions', icon: <CreditCard /> },
	{ label: 'Recorrentes', route: '/recurrencies', icon: <Timer /> },
	{ label: 'Faturas', route: '/invoices', icon: <SquareKanban /> },
	{ label: 'Analytics', route: '/analytics', icon: <LineChart /> },
	{ label: 'Times', route: '/teams', icon: <HeartHandshake /> },
	{ label: 'Gerenciar', route: '/manage', icon: <Settings /> },
	{ label: 'Sobre', route: '/about', icon: <Coffee /> },
];

export const MAX_DATE_RANGE_DAYS = 90;
