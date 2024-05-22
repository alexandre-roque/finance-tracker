import Navbar from '@/components/Navbar';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main>
			<Navbar />
			{children}
		</main>
	);
}
