'use client';

import BankingAccountComboBox from '@/components/BankingAccountComboBox';
import BankingAccountsTable from '@/components/BankingAccountsTable';
import CategoryPicker from '@/components/CategoryPicker';
import CreateCategoryDialog from '@/components/CreateCategoryDialog';
import { TransactionTitle } from '@/components/CreateTransactionDialog';
import CurrencyComboBox from '@/components/CurrencyComboBox';
import DeleteCategoryDialog from '@/components/DeleteCategoryDialog';
import EditCategoryDialog from '@/components/EditCategoryDialog';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { userSettingsType, categoriesType, bankingAccountsType } from '@/db/schema/finance';
import { TransactionType, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Pencil, PlusSquare, TrashIcon, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

function Manage() {
	const userSettingsQuery = useQuery({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	return (
		<>
			{/* HEADER */}
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<div>
						<p className='text-3xl font-bold'>Gerenciar</p>
						<p className='text-muted-foreground'>Gerencie sua conta e configurações</p>
					</div>
				</div>
			</div>
			{/* END HEDER */}
			<div className='container flex flex-col gap-4 p-4'>
				<Card>
					<CardHeader>
						<CardTitle>Moeda</CardTitle>
						<CardDescription>Selecione sua moeda padrão para transações</CardDescription>
					</CardHeader>
					<CardContent>
						<CurrencyComboBox />
					</CardContent>
				</Card>

				<Card className='w-full'>
					<CardHeader>
						<CardTitle>Conta bancária padrão</CardTitle>
						<CardDescription>
							Selecione qual será a sua conta bancária padrão para transações
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
							<BankingAccountComboBox isConfiguring userSettings={userSettingsQuery.data} />
						</SkeletonWrapper>
						<BankingAccountsList />
					</CardContent>
				</Card>

				<SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
					<CategoryList userSettings={userSettingsQuery.data} type='income' />
				</SkeletonWrapper>
				<SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
					<CategoryList userSettings={userSettingsQuery.data} type='expense' />
				</SkeletonWrapper>
			</div>
		</>
	);
}

export default Manage;

function BankingAccountsList() {
	const bankingAccountsQuery = useQuery<bankingAccountsType[]>({
		queryKey: ['banking-accounts'],
		queryFn: () => fetch('/api/banking-accounts').then((res) => res.json()),
	});

	return (
		<SkeletonWrapper isLoading={bankingAccountsQuery.isFetching}>
			<BankingAccountsTable data={bankingAccountsQuery.data || []} />
		</SkeletonWrapper>
	);
}

function CategoryList({ type, userSettings }: { type: TransactionType; userSettings?: userSettingsType }) {
	const categoriesQuery = useQuery({
		queryKey: ['categories', type],
		queryFn: () => fetch(`/api/categories?type=${type}`).then((res) => res.json()),
	});

	const dataAvailable = categoriesQuery.data && categoriesQuery.data.length > 0;

	return (
		<SkeletonWrapper isLoading={categoriesQuery.isLoading}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							{type === 'expense' ? (
								<TrendingDown className='h-12 w-12 items-center rounded-lg bg-red-400/10 p-2 text-red-500' />
							) : (
								<TrendingUp className='h-12 w-12 items-center rounded-lg bg-emerald-400/10 p-2 text-emerald-500' />
							)}
							<div>
								Categorias de {type === 'income' ? 'receitas' : 'despesas'}
								<div className='text-sm text-muted-foreground'>Ordenadas por nome</div>
							</div>
						</div>

						<CreateCategoryDialog
							type={type}
							successCallback={() => categoriesQuery.refetch()}
							trigger={
								<Button className='gap-2 text-sm'>
									<PlusSquare className='h-4 w-4' />
									Criar categoria
								</Button>
							}
						/>
					</CardTitle>
				</CardHeader>
				<Separator />
				<div className='p-2'>
					<CardDescription className='mb-1'>
						Selecione qual será sua categoria principal para <TransactionTitle type={type} />. Quando criar
						uma transação, a categoria irá ser preenchida automaticamente com a que selecionar.
					</CardDescription>

					<CategoryPicker isConfiguring type={type} userSettings={userSettings} />
				</div>
				<Separator />

				{!dataAvailable && (
					<div className='flex h-40 w-full flex-col items-center justify-center'>
						<p>
							Sem categorias de
							<span className={cn('m-1', type === 'income' ? 'text-emerald-500' : 'text-red-500')}>
								{type === 'income' ? 'receitas' : 'despesas'}
							</span>
							ainda
						</p>

						<p className='text-sm text-muted-foreground'>Crie uma para começar!</p>
					</div>
				)}
				{dataAvailable && (
					<div className='grid grid-flow-row gap-2 p-2 sm:grid-flow-row sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
						{categoriesQuery.data.map((category: categoriesType) => (
							<CategoryCard category={category} key={category.name} />
						))}
					</div>
				)}
			</Card>
		</SkeletonWrapper>
	);
}

function CategoryCard({ category }: { category: categoriesType }) {
	return (
		<div className='flex border-separate flex-col justify-between rounded-lg border shadow-md shadow-black/[0.1] dark:shadow-white/[0.1]'>
			<div className='flex flex-col items-center gap-2 p-4'>
				<span className='text-3xl' role='img'>
					{category.icon}
				</span>
				<span>{category.name}</span>
			</div>
			<EditCategoryDialog
				category={category}
				trigger={
					<Button
						className='flex rounded-none w-full items-center gap-2 text-muted-foreground dark:hover:bg-red-500/20 hover:bg-red-500/70 hover:text-white'
						variant={'secondary'}
					>
						<Pencil className='size-4' />
						Editar
					</Button>
				}
			/>
			<Separator className='bg-background' />
			<DeleteCategoryDialog
				category={category}
				trigger={
					<Button
						className='flex w-full border-separate items-center gap-2 rounded-t-none text-muted-foreground dark:hover:bg-red-500/20 hover:bg-red-500/70 hover:text-white'
						variant={'secondary'}
					>
						<TrashIcon className='size-4' />
						Remover
					</Button>
				}
			/>
		</div>
	);
}
