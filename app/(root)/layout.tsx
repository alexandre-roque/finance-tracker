import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className='grid min-h-screen w-full md:grid-cols-[70px_1fr] lg:grid-cols-[200px_1fr]'>
			<Navbar />
			<div className='flex flex-col'>
				<Header />
				<main>{children}</main>
				<Toaster />
			</div>
		</div>
	);
}
