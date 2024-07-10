import { auth } from '@/auth';
import CurrencyComboBox from '@/components/common/CurrencyComboBox';
import Logo from '@/components/common/Logo';
import RevalidateAndRedirect from '@/components/common/RevalidateAndRedirect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { redirect } from 'next/navigation';
import React from 'react';

const Wizard = async () => {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	return (
		<div className='container flex max-w-2xl flex-col items-center justify-between gap-4 mt-10'>
			<div>
				<h1 className='text-center text-3xl'>
					Seja bem vindo, <span className='ml-2 font-bold'>{session.user?.name} 👋</span>
				</h1>
				<h2 className='mt-4 text-center text-base text-muted-foreground'>Vamos configurar a sua conta!</h2>

				<h3 className='mt-2 text-center text-sm text-muted-foreground'>
					Você pode mudar essa configuração a qualquer momento
				</h3>
			</div>
			<Separator />
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>Moeda</CardTitle>
					<CardDescription>Configure a moeda usada nas transações</CardDescription>
				</CardHeader>
				<CardContent>
					<CurrencyComboBox />
				</CardContent>
			</Card>

			<RevalidateAndRedirect />
			<div className='mt-8'>
				<Logo />
			</div>
		</div>
	);
};

export default Wizard;
