'use client';

import { userSettingsType } from '@/db/schema/finance';
import { differenceInDays, endOfDay, startOfMonth } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DateRangePicker } from './ui/date-range-picker';
import { MAX_DATE_RANGE_DAYS } from '@/constants';
import StatsCards from './StatsCards';
import CategoriesStats from './CategoriesStats';
import MultipleSelector, { Option } from './ui/multiple-selector';
import { useQuery } from '@tanstack/react-query';
import SkeletonWrapper from './SkeletonWrapper';

function Overview({ userSettings }: { userSettings: userSettingsType }) {
	const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
		from: startOfMonth(new Date()),
		to: endOfDay(new Date()),
	});

	const [selectedTeams, setSelectedTeams] = useState<Option[]>([]);
	const [defaultOptions, setDefaultOptions] = useState<Option[]>([]);

	const teamsQuery = useQuery({
		queryKey: ['teams-members'],
		queryFn: () => fetch('/api/teams').then((res) => res.json()),
	});

	useEffect(() => {
		if (teamsQuery.data) {
			const data = teamsQuery.data?.map((teamMember: any) => ({
				label: teamMember.team.name,
				value: teamMember.team.id,
			}));

			setSelectedTeams(data);
			setDefaultOptions(data);
		}
	}, [teamsQuery.data]);

	return (
		<>
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
						selectedTeams={selectedTeams}
						userSettings={userSettings}
						from={dateRange.from}
						to={dateRange.to}
					/>
				</SkeletonWrapper>
				<CategoriesStats
					selectedTeams={selectedTeams}
					userSettings={userSettings}
					from={dateRange.from}
					to={dateRange.to}
				/>
			</div>
		</>
	);
}

export default Overview;
