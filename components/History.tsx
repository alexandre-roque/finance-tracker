'use client';

import SkeletonWrapper from '@/components/SkeletonWrapper';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSettingsType } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { Period, Timeframe, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import HistoryPeriodSelector from './HistoryPeriodSelector';

function History({ userSettings }: { userSettings: UserSettingsType }) {
	const [timeframe, setTimeframe] = useState<Timeframe>('month');
	const [period, setPeriod] = useState<Period>({
		month: new Date().getMonth(),
		year: new Date().getFullYear(),
	});

	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings.currency || 'BRL');
	}, [userSettings.currency]);

	const historyDataQuery = useQuery({
		queryKey: ['overview', 'history', timeframe, period],
		queryFn: () =>
			fetch('/api/history-data', {
				method: 'POST',
				body: JSON.stringify({
					timeframe,
					year: period.year,
					month: period.month,
				}),
			}).then((res) => res.json()),
	});

	const dataAvailable = historyDataQuery.data && historyDataQuery.data.length > 0;

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
									/>
									<Bar
										dataKey={'expense'}
										label='Despesa'
										fill='url(#expenseBar)'
										radius={4}
										className='cursor-pointer'
									/>
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

	const data = payload[0].payload;
	const { expense, income } = data;

	return (
		<div className='min-w-[300px] rounded border bg-background p-4'>
			<TooltipRow
				formatter={formatter}
				label='Expense'
				value={expense}
				bgColor='bg-red-500'
				textColor='text-red-500'
			/>
			<TooltipRow
				formatter={formatter}
				label='Income'
				value={income}
				bgColor='bg-emerald-500'
				textColor='text-emerald-500'
			/>
			<TooltipRow
				formatter={formatter}
				label='Média'
				value={income - expense}
				bgColor='bg-gray-100'
				textColor='text-foreground'
			/>
		</div>
	);
}

function TooltipRow({
	label,
	value,
	bgColor,
	textColor,
	formatter,
}: {
	label: string;
	textColor: string;
	bgColor: string;
	value: number;
	formatter: Intl.NumberFormat;
}) {
	const formattingFn = useCallback(
		(value: number) => {
			return formatter.format(value);
		},
		[formatter]
	);

	return (
		<div className='flex items-center gap-2'>
			<div className={cn('h-4 w-4 rounded-full', bgColor)} />
			<div className='flex w-full justify-between'>
				<p className='text-sm text-muted-foreground'>{label}</p>
				<div className={cn('text-sm font-bold', textColor)}>
					<CountUp
						duration={0.5}
						preserveValue
						end={value}
						decimals={2}
						formattingFn={formattingFn}
						className='text-sm'
					/>
				</div>
			</div>
		</div>
	);
}
