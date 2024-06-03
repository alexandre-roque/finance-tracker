import { auth } from '@/auth';
import CardComboBox from '@/components/CardComboBox';
import CategoryPicker from '@/components/CategoryPicker';
import { TransactionTitle } from '@/components/CreateTransactionDialog';
import CurrencyComboBox from '@/components/CurrencyComboBox';
import Logo from '@/components/Logo';
import RevalidateAndRedirect from '@/components/RevalidateAndRedirect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { db } from '@/db';
import { userSettings } from '@/db/schema/finance';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import React from 'react';

const Wizard = async () => {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const [currentUserSettings] = await db.select().from(userSettings).where(eq(userSettings.userId, session.user.id));

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
					<CardTitle>
						Categoria principal para <TransactionTitle type='income' />
					</CardTitle>
					<CardDescription>
						Selecione qual será sua categoria principal para receitas. Quando criar uma transação, ela irá
						ser preenchida automaticamente. Você pode selecionar isso depois
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CategoryPicker userSettings={currentUserSettings} type='income' isConfiguring />
				</CardContent>
			</Card>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>
						Categoria principal para <TransactionTitle type='expense' />
					</CardTitle>
					<CardDescription>
						Selecione qual será sua categoria principal para despesas. Quando criar uma transação, ela irá
						ser preenchida automaticamente. Você pode selecionar isso depois
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CategoryPicker userSettings={currentUserSettings} type='expense' isConfiguring />
				</CardContent>
			</Card>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle>Cartões</CardTitle>
					<CardDescription>Selecione qual será o seu cartão principal</CardDescription>
				</CardHeader>
				<CardContent>
					<CardComboBox isConfiguring userSettings={currentUserSettings} />
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
