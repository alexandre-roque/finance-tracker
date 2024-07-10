'use client';

import { GetBalanceStatsResponseType } from '@/app/api/stats/balance/route';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { Card } from '@/components/ui/card';
import { DateToUTCDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import React, { ReactNode, useCallback, useMemo } from 'react';
import CountUp from 'react-countup';
import { Option } from '../ui/multiple-selector';

interface Props {
	from: Date;
	to: Date;
	formatter: Intl.NumberFormat;
	selectedTeams?: Option[];
	disableAnimations?: boolean;
}

function StatsCards({ from, to, formatter, selectedTeams, disableAnimations }: Props) {
	const statsQuery = useQuery<GetBalanceStatsResponseType>({
		queryKey: ['overview', 'stats', from, to],
		queryFn: () =>
			fetch(`/api/stats/balance?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`).then((res) => res.json()),
	});

	const { income, expense } = useMemo(
		() =>
			statsQuery.data
				? statsQuery.data.reduce(
						(acc, stats) => {
							if (
								(!stats.teamId && selectedTeams?.some((t) => t.value === 'me')) ||
								selectedTeams?.some((t) => t.value === stats.teamId)
							) {
								acc[stats.type as 'income' | 'expense'] += parseFloat(stats.value ?? '0');
							}
							return acc;
						},
						{
							income: 0,
							expense: 0,
						}
				  )
				: {
						income: 0,
						expense: 0,
				  },
		[statsQuery.data, selectedTeams]
	);

	const balance = income - expense;

	return (
		<div className='relative flex w-full flex-wrap gap-2 md:flex-nowrap'>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					value={income}
					title='Receita'
					icon={
						<TrendingUp className='h-12 w-12 items-center rounded-lg p-2 text-emerald-500 bg-emerald-400/10' />
					}
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					value={expense}
					title='Despesa'
					icon={<TrendingDown className='h-12 w-12 items-center rounded-lg p-2 text-red-500 bg-red-400/10' />}
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					value={balance}
					title='Saldo'
					icon={<Scale className='h-12 w-12 items-center rounded-lg p-2 text-violet-500 bg-violet-400/10' />}
				/>
			</SkeletonWrapper>
		</div>
	);
}

export default StatsCards;

export function StatCard({
	disableAnimations,
	formatter,
	value,
	title,
	icon,
}: {
	formatter: Intl.NumberFormat;
	icon: ReactNode;
	title: String;
	value: number;
	disableAnimations?: boolean;
}) {
	const formatFn = useCallback(
		(value: number) => {
			return formatter.format(value);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[formatter, value]
	);

	return (
		<Card className='flex h-24 w-full items-center gap-2 p-4'>
			{icon}
			<div className='flex flex-col items-start gap-0'>
				<p className='text-muted-foreground'>{title}</p>
				<CountUp
					preserveValue
					redraw={false}
					end={value}
					decimals={2}
					formattingFn={formatFn}
					className='text-2xl'
					duration={disableAnimations ? 0 : 2}
				/>
			</div>
		</Card>
	);
}
