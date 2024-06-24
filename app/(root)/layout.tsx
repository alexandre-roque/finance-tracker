import { auth } from '@/auth';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { db } from '@/db';
import { userSettings } from '@/db/schema/finance';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { SessionProvider } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const [currentUserSettings] = await db.select().from(userSettings).where(eq(userSettings.userId, session.user.id));
	if (!currentUserSettings) {
		redirect('/wizard');
	}

	const queryClient = new QueryClient();
	await queryClient.prefetchQuery({
		queryKey: ['user-settings'],
		queryFn: () => currentUserSettings,
	});

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className='grid min-h-screen w-full md:grid-cols-[70px_1fr] lg:grid-cols-[200px_1fr]'>
				<Navbar />
				<SessionProvider session={session}>
					<div className='flex flex-col'>
						<Header />
						<main>{children}</main>
					</div>
				</SessionProvider>
			</div>
		</HydrationBoundary>
	);
}
