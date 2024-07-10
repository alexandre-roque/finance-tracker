import { auth } from '@/auth';
import CreateTransactionDialog from '@/components/transaction/CreateTransactionDialog';
import Overview from '@/components/common/Overview';
import History from '@/components/common/History';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import React from 'react';

const Home = async () => {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	return (
		<div className='h-full bg-background mb-12'>
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<p className='text-2xl font-bold'>Olá, {session.user.name}! 👋</p>

					<div className='flex items-center gap-3'>
						<CreateTransactionDialog
							type='income'
							trigger={
								<Button
									variant='outline'
									className='border-emerald-500 bg-income text-white hover:bg-income-foreground hover:text-white'
								>
									Nova receita 🤑
								</Button>
							}
						/>

						<CreateTransactionDialog
							type='expense'
							trigger={
								<Button
									variant='outline'
									className='border-rose-500 bg-expense text-white hover:bg-expense-foreground hover:text-white'
								>
									Nova despesa 😤
								</Button>
							}
						/>
					</div>
				</div>
			</div>
			<Overview />
			<History />
		</div>
	);
};

export default Home;
