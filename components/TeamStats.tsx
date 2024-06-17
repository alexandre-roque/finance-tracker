'use client';

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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
				<TeamsCard selectedTeams={selectedTeams} formatter={formatter} type='income' data={statsQuery.data} />
			</SkeletonWrapper>
			<SkeletonWrapper isLoading={statsQuery.isFetching}>
				<TeamsCard selectedTeams={selectedTeams} formatter={formatter} type='expense' data={statsQuery.data} />
			</SkeletonWrapper>
		</div>
	);
}

export default TeamsStats;

function TeamsCard({
	data,
	type,
	formatter,
	selectedTeams,
}: {
	type: TransactionType;
	formatter: Intl.NumberFormat;
	data?: GetTeamsBalanceResponseType;
	selectedTeams?: Option[];
}) {
	const filteredData = useMemo(
		() =>
			(data?.totals || []).filter((el) => {
				if (
					el.type === type &&
					((!el.teamId && selectedTeams?.some((t) => t.value === 'me')) ||
						selectedTeams?.some((t) => t.value === el.teamId))
				) {
					return true;
				}
			}),
		[data, selectedTeams, type]
	);

	const total = filteredData.reduce((acc, el) => acc + (parseFloat(el.value ?? '0') || 0), 0);

	const groupedData: { [key: string]: { [key: string]: number; totalAmount: number } } = filteredData.reduce(
		(acc, el) => {
			const team = el.teamName ?? 'Eu';
			const amount = parseFloat(el.value ?? '0') || 0;
			const key = `${team}_${el.teamId}`;

			acc[key] = acc[key] || ({} as { [key: string]: number; totalAmount: number });
			acc[key][el.userId] = (acc[key][el.userId] || 0) + amount;
			acc[key].totalAmount = (acc[key].totalAmount || 0) + amount;

			return acc;
		},
		{} as { [key: string]: { [key: string]: number; totalAmount: number } }
	);

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
							{Object.entries(groupedData).map(([teamKey, teamData], i) => {
								const teamTotal = teamData.totalAmount;
								const teamMembers = Object.entries(teamData).filter(([key]) => key !== 'totalAmount');
								const [teamName, teamId] = teamKey.split('_');
								const team = data?.teamsResult.find((t) => t.teamId === teamId);

								const percentage = (teamTotal * 100) / (total || teamTotal);

								return (
									<div key={teamName} className='flex flex-col gap-2'>
										<div className='flex items-center justify-between'>
											<span className='flex items-center text-gray-400'>
												{teamName}
												<span className='ml-2 text-xs text-muted-foreground'>
													({percentage.toFixed(0)}%)
												</span>
											</span>

											<span className='text-sm text-gray-400'>{formatter.format(teamTotal)}</span>
										</div>
										<Progress
											value={percentage}
											indicator={type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}
										/>
										{team?.team?.splitType === 'percentage' &&
											(team?.team?.members.length ?? 0) > 1 && (
												<div className='flex flex-col gap-2'>
													<Accordion type='single' collapsible>
														<AccordionItem value='item-1'>
															<AccordionTrigger>
																Valores distribuídos de {teamName}
															</AccordionTrigger>
															<AccordionContent className='flex flex-col gap-2'>
																{team?.team?.members.map((member) => {
																	const memberPercentage = member.percentage || 0;
																	const memberAmount =
																		(teamTotal * memberPercentage) / 100;
																	const realAmount =
																		teamMembers.find(
																			([key]) => key === member.user.id
																		)?.[1] || 0;

																	return (
																		<div
																			key={member.user.name ?? 'Eu'}
																			className='flex items-start justify-between flex-col'
																		>
																			<span className='flex items-center text-primary'>
																				{member.user.name ?? 'Eu'}
																				<span className='ml-2 text-xs text-muted-foreground'>
																					({memberPercentage.toFixed(2)}%)
																				</span>
																			</span>

																			<span className='text-sm text-secondary-foreground flex flex-col'>
																				<span>
																					Total pago:{' '}
																					{formatter.format(realAmount)}
																				</span>
																				<span>
																					Total esperado:{' '}
																					{formatter.format(memberAmount)}
																				</span>
																				<span>
																					Diferença:{' '}
																					{formatter.format(
																						realAmount - memberAmount
																					)}
																				</span>
																			</span>
																		</div>
																	);
																})}
															</AccordionContent>
														</AccordionItem>
													</Accordion>
												</div>
											)}
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
