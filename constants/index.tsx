import { Coffee, CreditCard, HeartHandshake, Home, LineChart, Settings, Timer } from 'lucide-react';

export const sideBarLinks = [
	{ label: 'Dashboard', route: '/', icon: <Home /> },
	{ label: 'Transações', route: '/transactions', icon: <CreditCard /> },
	{ label: 'Recorrentes', route: '/recurrencies', icon: <Timer /> },
	{ label: 'Analytics', route: '/analytics', icon: <LineChart /> },
	{ label: 'Times', route: '/teams', icon: <HeartHandshake /> },
	{ label: 'Gerenciar', route: '/manage', icon: <Settings /> },
	{ label: 'Cafézin', route: '/buy-me-a-coffee', icon: <Coffee /> },
];

export const MAX_DATE_RANGE_DAYS = 90;
