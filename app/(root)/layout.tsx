import { auth } from '@/auth';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { SessionProvider } from 'next-auth/react';

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[70px_1fr] lg:grid-cols-[200px_1fr]">
            <Navbar />
            <SessionProvider session={session} >
                <div className="flex flex-col">
                    <Header />
                    <main>{children}</main>
                </div>
            </SessionProvider>
        </div>
    );
}
