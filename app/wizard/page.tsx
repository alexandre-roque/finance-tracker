import { auth } from '@/auth';
import CardComboBox from '@/components/CardComboBox';
import CurrencyComboBox from '@/components/CurrencyComboBox';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

const Wizard = async () => {
	const session = await auth();
	if (!session) {
		redirect('/sign-in');
	}

	return (
		<div className='container flex max-w-2xl flex-col items-center justify-between gap-4'>
			<div>
				<h1 className='text-center text-3xl'>
					Seja bem vindo, <span className='ml-2 font-bold'>{session.user?.name} 👋</span>
				</h1>
				<h2 className='mt-4 text-center text-base text-muted-foreground'>Vamos configurar a sua conta!</h2>

				<h3 className='mt-2 text-center text-sm text-muted-foreground'>
					Você pode mudar essas configurações a qualquer momento
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
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>Cartões</CardTitle>
					<CardDescription>Selecione qual será o seu cartão principal</CardDescription>
				</CardHeader>
				<CardContent>
					<CardComboBox />
				</CardContent>
			</Card>
			<Separator />
			<Button className='w-full' asChild>
				<Link href={'/'}>Tudo certo! Leve-me para página inicial</Link>
			</Button>
			<div className='mt-8'>
				<Logo />
			</div>
		</div>
	);
};

export default Wizard;
