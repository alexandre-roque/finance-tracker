'use client';

import { GetCategoriesStatsResponseType } from '@/app/api/stats/categories/route';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { userSettingsType } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { DateToUTCDate, TransactionType } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { TransactionTitle } from './CreateTransactionDialog';
import { Option } from './ui/multiple-selector';
import { GetAccountsBalanceResponseType } from '@/app/api/stats/accounts/route';

interface Props {
	formatter: Intl.NumberFormat;
	from: Date;
	to: Date;
	selectedTeams?: Option[];
}

function AccountsStats({ formatter, from, to, selectedTeams }: Props) {
	const statsQuery = useQuery<GetAccountsBalanceResponseType>({
		queryKey: ['overview', 'stats', 'accounts', from, to],
		queryFn: () =>
			fetch(`/api/stats/accounts?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`).then((res) => res.json()),
	});

	return (
		<div className='flex w-full flex-wrap gap-2 md:flex-nowrap'>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<AccountsCard
					selectedTeams={selectedTeams}
					formatter={formatter}
					type='income'
					data={statsQuery.data || []}
				/>
			</SkeletonWrapper>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<AccountsCard
					selectedTeams={selectedTeams}
					formatter={formatter}
					type='expense'
					data={statsQuery.data || []}
				/>
			</SkeletonWrapper>
		</div>
	);
}

export default AccountsStats;

function AccountsCard({
	data,
	type,
	formatter,
	selectedTeams,
}: {
	type: TransactionType;
	formatter: Intl.NumberFormat;
	data: GetAccountsBalanceResponseType;
	selectedTeams?: Option[];
}) {
	const filteredData = useMemo(
		() =>
			data.filter((el) => {
				if (
					el.type === type &&
					((!el.teamId && selectedTeams?.some((t) => t.value === 'me')) ||
						selectedTeams?.some((t) => t.value === el.teamId))
				) {
					return true;
				}
			}),
		[data, type, selectedTeams]
	);

	const total = filteredData.reduce((acc, el) => acc + (parseFloat(el.value ?? '0') || 0), 0);

	return (
		<Card className='h-96 w-full col-span-6'>
			<CardHeader>
				<CardTitle className='grid grid-flow-row justify-between gap-2 text-muted-foreground md:grid-flow-col'>
					{type === 'income' ? 'Receitas' : 'Despesas'} por conta
				</CardTitle>
			</CardHeader>

			<div className='flex items-center justify-between gap-2'>
				{filteredData.length === 0 && (
					<div className='flex h-72 w-full flex-col items-center justify-center px-4'>
						Sem dados para o período selecionado
						<p className='text-sm text-muted-foreground text-center'>
							Tente selecionar um período diferente ou adicionar uma nova <TransactionTitle type={type} />
						</p>
					</div>
				)}

				{filteredData.length > 0 && (
					<ScrollArea className='w-full px-4 h-72'>
						<div className='flex w-full flex-col gap-4 p-4'>
							{filteredData.map((item) => {
								const amount = parseFloat(item.value ?? '0') || 0;
								const percentage = (amount * 100) / (total || amount);

								return (
									<div key={item.bankingAccount} className='flex flex-col gap-2'>
										<div className='flex items-center justify-between'>
											<span className='flex items-center'>
												{item.bankingAccount}
												<span className='ml-2 text-xs text-muted-foreground'>
													({percentage.toFixed(2)}%)
												</span>
											</span>

											<span className='text-sm text-muted-foreground'>{formatter.format(amount)}</span>
										</div>

										<Progress
											value={percentage}
											indicator={type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}
										/>
									</div>
								);
							})}
						</div>
					</ScrollArea>
				)}
			</div>
		</Card>
	);
}
