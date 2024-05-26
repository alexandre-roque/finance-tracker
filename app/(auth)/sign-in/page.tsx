'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import AuthForm from '../../../components/AuthForm';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const SignIn = () => {
	return (
		<main className='flex min-h-screen flex-col items-center justify-between lg:p-24 p-6'>
			<Card>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl'>Acesse sua conta</CardTitle>
					<CardDescription>Você pode usar uma das opções abaixo</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-4'>
					<div className='grid grid-cols-2 gap-6'>
						<Button
							onClick={() => signIn('github', { redirect: true, callbackUrl: '/' })}
							variant='outline'
						>
							<Icons.gitHub className='mr-2 h-4 w-4' />
							Github
						</Button>
						<Button
							onClick={() => signIn('google', { redirect: true, callbackUrl: '/' })}
							variant='outline'
						>
							<Icons.google className='mr-2 h-4 w-4' />
							Google
						</Button>
						<Button
							onClick={() => signIn('discord', { redirect: true, callbackUrl: '/' })}
							variant='outline'
						>
							<Icons.discord className='mr-2 h-4 w-4' />
							Discord
						</Button>
					</div>
					<div className='relative'>
						<div className='absolute inset-0 flex items-center'>
							<span className='w-full border-t' />
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='bg-background px-2 text-muted-foreground'>Ou continue com</span>
						</div>
					</div>
					<AuthForm type='sign-in' />
				</CardContent>
			</Card>
		</main>
	);
};

export default SignIn;
