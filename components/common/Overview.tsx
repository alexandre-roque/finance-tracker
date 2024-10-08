'use client';

import { userSettingsType } from '@/db/schema/finance';
import { differenceInDays, endOfMonth, startOfMonth } from 'date-fns';
import React, { use, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DateRangePicker } from '../ui/date-range-picker';
import { MAX_DATE_RANGE_DAYS } from '@/constants';
import StatsCards from '../stats/StatsCards';
import CategoriesStats from '../category/CategoriesStats';
import MultipleSelector, { Option } from '../ui/multiple-selector';
import { useQuery } from '@tanstack/react-query';
import SkeletonWrapper from './SkeletonWrapper';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AccountsStats from '../stats/AccountsStats';
import TeamsStats from '../stats/TeamStats';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { teamsQueryType } from '../team/TeamsComboBox';
import TotalBalanceAndCreditStats from '../stats/TotalBalanceAndCreditStats';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

function Overview() {
	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const userSettings = userSettingsQuery.data;
	const teamsQuery = useQuery<teamsQueryType[]>({
		queryKey: ['teams-members'],
		queryFn: () => fetch('/api/teams').then((res) => res.json()),
	});

	const { replace } = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const dateRange = {
		from: new Date(searchParams.get('from') || startOfMonth(new Date()).toISOString()),
		to: new Date(searchParams.get('to') || endOfMonth(new Date()).toISOString()),
	};
	const [isHidden, setIsHidden] = useState(userSettings?.hideMoney || false);

	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings?.currency || 'BRL', isHidden);
	}, [isHidden, userSettings?.currency]);

	const setDateRange = (values: { from: Date; to: Date }) => {
		if (differenceInDays(values.to, values.from) > MAX_DATE_RANGE_DAYS) {
			toast.error(`Muitos dias selecionados, o máximo é ${MAX_DATE_RANGE_DAYS}!`);
			return;
		}
		const params = new URLSearchParams(searchParams);
		params.set('from', values.from.toISOString());
		params.set('to', values.to.toISOString());
		replace(`${pathname}?${params.toString()}`);
	};

	const [selectedTeams, setSelectedTeams] = useState<Option[]>([{ label: 'Sem time', value: 'me' }]);
	const [defaultOptions, setDefaultOptions] = useState<Option[]>([{ label: 'Sem time', value: 'me' }]);

	useEffect(() => {
		if (teamsQuery.data) {
			const data = teamsQuery.data.map((teamMember: any) => ({
				label: teamMember.team.name,
				value: teamMember.team.id,
				hideOnLandingPage: teamMember.team.hideOnLandingPage,
			}));

			setSelectedTeams((prev) => {
				data.filter((teamMember) => !teamMember.hideOnLandingPage).forEach((op: Option) => {
					if (!prev.some((t) => t.value === op.value)) {
						prev.push(op);
					}
				});
				return [...prev];
			});

			setDefaultOptions((prev) => {
				data.forEach((op: Option) => {
					if (!prev.some((t) => t.value === op.value)) {
						prev.push(op);
					}
				});
				return [...prev];
			});
		}
	}, [teamsQuery.data]);

	return (
		<>
			<div className='container flex w-full flex-col gap-2 mt-4'>
				<div className='flex gap-2 justify-between'>
					<div>
						<h1 className='text-4xl font-bold'>Dashboard</h1>
						<p className='text-lg text-muted-foreground'>
							Visão geral de todas as contas e cartões de créditos
						</p>
					</div>
					<Button variant='secondary' onClick={() => setIsHidden(!isHidden)}>
						<span className='mr-2'>Esconder</span>{' '}
						{isHidden ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
					</Button>
				</div>
				<SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
					<TotalBalanceAndCreditStats
						disableAnimations={userSettings?.disableAnimations ?? false}
						formatter={formatter}
					/>
				</SkeletonWrapper>
			</div>
			<div className='container flex flex-wrap items-end justify-between gap-2 pt-6 pb-2'>
				<h2 className='text-3xl font-bold'>Visão geral</h2>
				<div className='flex justify-end w-full flex-wrap gap-2 md:flex-nowrap'>
					<SkeletonWrapper isLoading={teamsQuery.isFetching}>
						<MultipleSelector
							hidePlaceholderWhenSelected
							onChange={(op) => setSelectedTeams(op)}
							options={defaultOptions}
							value={selectedTeams}
							placeholder='Selecione os times...'
							className='h-11'
							emptyIndicator={
								<p className='text-center text-lg leading-10 text-gray-600 dark:text-gray-400'>
									Sem resultados...
								</p>
							}
						/>
					</SkeletonWrapper>
					<DateRangePicker
						locale='pt-BR'
						initialDateFrom={dateRange.from}
						initialDateTo={dateRange.to}
						showCompare={false}
						onUpdate={(values) => {
							const { from, to } = values.range;
							// We update the date range only if both dates are set

							if (!from || !to) return;
							if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
								toast.error(`Muitos dias selecionados, o máximo é ${MAX_DATE_RANGE_DAYS}!`);
								return;
							}

							setDateRange({ from, to });
						}}
					/>
				</div>
			</div>
			<div className='container flex w-full flex-col gap-2'>
				<SkeletonWrapper isLoading={teamsQuery.isFetching}>
					<StatsCards
						disableAnimations={userSettings?.disableAnimations ?? false}
						selectedTeams={selectedTeams}
						formatter={formatter}
						from={dateRange.from}
						to={dateRange.to}
					/>
				</SkeletonWrapper>
				<SkeletonWrapper isLoading={teamsQuery.isFetching}>
					<CategoriesStats
						selectedTeams={selectedTeams}
						formatter={formatter}
						from={dateRange.from}
						to={dateRange.to}
					/>
				</SkeletonWrapper>

				{pathname === '/analytics' && (
					<SkeletonWrapper isLoading={teamsQuery.isFetching}>
						<TeamsStats
							selectedTeams={selectedTeams}
							formatter={formatter}
							from={dateRange.from}
							to={dateRange.to}
						/>
					</SkeletonWrapper>
				)}

				{pathname === '/analytics' && (
					<SkeletonWrapper isLoading={teamsQuery.isFetching}>
						<AccountsStats
							selectedTeams={selectedTeams}
							formatter={formatter}
							from={dateRange.from}
							to={dateRange.to}
						/>
					</SkeletonWrapper>
				)}
			</div>
		</>
	);
}

export default Overview;
