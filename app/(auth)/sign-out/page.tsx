'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

const SignOut = () => {
	const [isLoading, setIsLoading] = useState(false);
	return (
		<main className='flex min-h-screen flex-col items-center justify-between lg:p-24 p-6 bg-pokeRed'>
			<Card>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl'>Você deseja sair?</CardTitle>
					<CardDescription>Clique em sair</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-4'>
					<Button
						disabled={isLoading}
						onClick={async () => {
							setIsLoading(true);
							await signOut({ callbackUrl: '/', redirect: true });
							setIsLoading(false);
						}}
					>
						{isLoading ? <Loader2 className='animate-spin' /> : 'Sair'}
					</Button>
				</CardContent>
			</Card>
		</main>
	);
};

export default SignOut;
