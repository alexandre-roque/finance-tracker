import type { Metadata } from 'next';
import { Inter, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import RootProviders from '@/components/RootProviders';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });
const ibmPlexSerif = IBM_Plex_Serif({
	subsets: ['latin'],
	weight: ['400', '700'],
	variable: '--font-ibm-plex-serif',
});

export const metadata: Metadata = {
	title: 'Finance Tracker',
	description: 'Esse aplicativo irá te ajudar com suas finanças!',
	// icons: {
	// 	icon: '/icons/piggy-bank_64px.png',
	// },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html suppressHydrationWarning lang='ptBr'>
			<body className={`${inter.className} ${ibmPlexSerif.variable}`}>
				<RootProviders>{children}</RootProviders>
				<Toaster />
			</body>
		</html>
	);
}
