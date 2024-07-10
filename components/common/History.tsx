'use client';

import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userSettingsType } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { Period, Timeframe, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import HistoryPeriodSelector from './HistoryPeriodSelector';

function History({}) {
	const [timeframe, setTimeframe] = useState<Timeframe>('year');
	const [period, setPeriod] = useState<Period>({
		month: new Date().getMonth(),
		year: new Date().getFullYear(),
	});

	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});
	const userSettings = userSettingsQuery.data;

	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings?.currency || 'BRL');
	}, [userSettings?.currency]);

	const historyDataQuery = useQuery({
		queryKey: ['overview', 'history', timeframe, period],
		queryFn: () =>
			fetch(`/api/history-data?timeframe=${timeframe}&year=${period.year}&month=${period.month}`).then((res) =>
				res.json()
			),
	});

	const dataAvailable = historyDataQuery.data && historyDataQuery.data.length > 0;
	const otherBars = Object.keys(historyDataQuery.data || {})
		.reduce((acc, entry) => {
			return acc.concat(
				Object.keys(historyDataQuery.data[entry]).filter(
					(key) => (acc.indexOf(key) < 0 && key.includes('expense_')) || key.includes('income_')
				)
			);
		}, [] as string[])
		.map((key: string, index) => {
			const [type, teamName, color] = key.split('_');
			return (
				<Bar
					key={index}
					dataKey={key}
					label={`${type === 'income' ? 'Receita' : 'Despesa'} de ${teamName}`}
					fill={color}
					radius={4}
					className='cursor-pointer'
					stackId={type}
				/>
			);
		});
	return (
		<div className='container'>
			<h2 className='mt-12 text-3xl font-bold'>Histórico</h2>
			<Card className='col-span-12 mt-2 w-full'>
				<CardHeader className='gap-2'>
					<CardTitle className='grid grid-flow-row justify-between gap-2 md:grid-flow-col'>
						<HistoryPeriodSelector
							period={period}
							setPeriod={setPeriod}
							timeframe={timeframe}
							setTimeframe={setTimeframe}
						/>

						<div className='flex h-10 gap-2'>
							<Badge variant={'outline'} className='flex items-center gap-2 text-sm'>
								<div className='h-4 w-4 rounded-full bg-emerald-500'></div>
								Receita
							</Badge>
							<Badge variant={'outline'} className='flex items-center gap-2 text-sm'>
								<div className='h-4 w-4 rounded-full bg-red-500'></div>
								Despesa
							</Badge>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<SkeletonWrapper isLoading={historyDataQuery.isFetching}>
						{dataAvailable && (
							<ResponsiveContainer width={'100%'} height={300}>
								<BarChart height={300} data={historyDataQuery.data} barCategoryGap={5}>
									<defs>
										<linearGradient id='incomeBar' x1='0' y1='0' x2='0' y2='1'>
											<stop offset={'0'} stopColor='#10b981' stopOpacity={'1'} />
											<stop offset={'1'} stopColor='#10b981' stopOpacity={'0'} />
										</linearGradient>

										<linearGradient id='expenseBar' x1='0' y1='0' x2='0' y2='1'>
											<stop offset={'0'} stopColor='#ef4444' stopOpacity={'1'} />
											<stop offset={'1'} stopColor='#ef4444' stopOpacity={'0'} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray='5 5' strokeOpacity={'0.2'} vertical={false} />
									<XAxis
										stroke='#888888'
										fontSize={12}
										tickLine={false}
										axisLine={false}
										padding={{ left: 5, right: 5 }}
										dataKey={(data) => {
											const { year, month, day } = data;
											const date = new Date(year, month, day || 1);
											if (timeframe === 'year') {
												return date.toLocaleDateString('default', {
													month: 'long',
												});
											}
											return date.toLocaleDateString('default', {
												day: '2-digit',
											});
										}}
									/>
									<YAxis stroke='#888888' fontSize={12} tickLine={false} axisLine={false} />
									<Bar
										dataKey={'income'}
										label='Receita'
										fill='url(#incomeBar)'
										radius={4}
										className='cursor-pointer'
										stackId={'income'}
									/>
									<Bar
										dataKey={'expense'}
										label='Despesa'
										fill='url(#expenseBar)'
										radius={4}
										className='cursor-pointer'
										stackId={'expense'}
									/>
									{otherBars}
									<Tooltip
										cursor={{ opacity: 0.1 }}
										content={(props) => <CustomTooltip formatter={formatter} {...props} />}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
						{!dataAvailable && (
							<Card className='flex h-[300px] flex-col items-center justify-center bg-background'>
								Sem dados para o período selecionado
								<p className='text-sm text-muted-foreground'>
									Tente outro período ou adicione alguma transação
								</p>
							</Card>
						)}
					</SkeletonWrapper>
				</CardContent>
			</Card>
		</div>
	);
}

export default History;

function CustomTooltip({ active, payload, formatter }: any) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload as Record<string, string>;
	const objectsArray = data
		? Object.entries(data).reduce((acc: Record<string, any>, entry) => {
				if (entry[0].includes('expense') || entry[0].includes('income')) {
					const [type, teamName, color] = entry[0].split('_');
					if (acc[teamName ?? 'Você']) {
						acc[teamName ?? 'Você'][`${type}Value`] = entry[1];
						acc[teamName ?? 'Você'][`${type}Color`] = color;
					} else {
						acc[teamName ?? 'Você'] = { [`${type}Value`]: entry[1] };
						acc[teamName ?? 'Você'][`${type}Color`] = color;
					}
				}
				return acc;
		  }, {})
		: {};

	return (
		<div className='min-w-[300px] rounded border bg-background p-4'>
			{Object.entries(objectsArray).map((entry, key) => (
				<TooltipRow
					key={key}
					formatter={formatter}
					label={entry[0]}
					incomeValue={entry[1].incomeValue}
					incomeColor={entry[1].incomeColor ?? 'var(--income-foreground)'}
					expenseValue={entry[1].expenseValue}
					expenseColor={entry[1].expenseColor ?? 'var(--expense-foreground)'}
				/>
			))}
		</div>
	);
}

function TooltipRow({
	label,
	incomeValue,
	expenseValue,
	formatter,
	expenseColor,
	incomeColor,
}: {
	label: string;
	incomeValue: number;
	expenseValue: number;
	formatter: Intl.NumberFormat;
	expenseColor?: string;
	incomeColor?: string;
}) {
	const formattingFn = useCallback(
		(value: number) => {
			return formatter.format(value);
		},
		[formatter]
	);

	return (
		<div className='flex items-center gap-2'>
			<div className='flex w-full justify-between'>
				<p className='text-sm text-muted-foreground'>{label}</p>
				<div className={'text-sm font-bold flex gap-2'}>
					<CountUp
						duration={0.5}
						preserveValue
						end={expenseValue}
						decimals={2}
						formattingFn={formattingFn}
						className='text-sm text-expense-foreground'
						style={{
							color: expenseColor,
						}}
					/>
					<CountUp
						duration={0.5}
						preserveValue
						end={incomeValue}
						decimals={2}
						formattingFn={formattingFn}
						className='text-sm text-income-foreground'
					/>
				</div>
			</div>
		</div>
	);
}
