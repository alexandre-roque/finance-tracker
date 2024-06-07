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
import { GetTeamsBalanceResponseType } from '@/app/api/stats/teams/route';
import { ResponsiveContainer, Pie, Tooltip, PieChart, Cell } from 'recharts';

interface Props {
	userSettings: userSettingsType;
	from: Date;
	to: Date;
	selectedTeams?: Option[];
}

function TeamsStats({ userSettings, from, to, selectedTeams }: Props) {
	const statsQuery = useQuery<GetTeamsBalanceResponseType>({
		queryKey: ['overview', 'stats', 'teams', from, to],
		queryFn: () =>
			fetch(`/api/stats/teams?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`).then((res) => res.json()),
	});

	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings.currency || 'BRL');
	}, [userSettings.currency]);

	return (
		<div className='flex w-full flex-wrap gap-2 md:flex-nowrap'>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<TeamsCard
					selectedTeams={selectedTeams}
					formatter={formatter}
					type='income'
					data={statsQuery.data || []}
				/>
			</SkeletonWrapper>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<TeamsCard
					selectedTeams={selectedTeams}
					formatter={formatter}
					type='expense'
					data={statsQuery.data || []}
				/>
			</SkeletonWrapper>
		</div>
	);
}

export default TeamsStats;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}: {
	cx: number;
	cy: number;
	midAngle: number;
	innerRadius: number;
	outerRadius: number;
	percent: number;
}) => {
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text x={x} y={y} fill='white' textAnchor={x > cx ? 'start' : 'end'} dominantBaseline='central'>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

function TeamsCard({
	data,
	type,
	formatter,
	selectedTeams,
}: {
	type: TransactionType;
	formatter: Intl.NumberFormat;
	data: GetTeamsBalanceResponseType;
	selectedTeams?: Option[];
}) {
	const filteredData = data.filter((el) => {
		if (
			el.type === type &&
			((!el.teamId && selectedTeams?.some((t) => t.value === 'me')) ||
				selectedTeams?.some((t) => t.value === el.teamId))
		) {
			return true;
		}
	});

	const total = filteredData.reduce((acc, el) => acc + (parseFloat(el.value ?? '0') || 0), 0);

	return (
		<Card className='h-96 w-full col-span-6'>
			<CardHeader>
				<CardTitle className='grid grid-flow-row justify-between gap-2 text-muted-foreground md:grid-flow-col'>
					{type === 'income' ? 'Receitas' : 'Despesas'} por time
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
									<div key={item.teamName ?? 'Eu'} className='flex flex-col gap-2'>
										<div className='flex items-center justify-between'>
											<span className='flex items-center text-gray-400'>
												{item.teamName ?? 'Eu'}
												<span className='ml-2 text-xs text-muted-foreground'>
													({percentage.toFixed(0)}%)
												</span>
											</span>

											<span className='text-sm text-gray-400'>{formatter.format(amount)}</span>
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
