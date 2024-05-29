'use client';

// import CategoriesStats from '@/app/(dashboard)/_components/CategoriesStats';
// import StatsCards from '@/app/(dashboard)/_components/StatsCards';
import { UserSettingsType } from '@/db/schema/finance';
import { differenceInDays, endOfDay, startOfMonth } from 'date-fns';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { DateRangePicker } from './ui/date-range-picker';
import { MAX_DATE_RANGE_DAYS } from '@/constants';
import StatsCards from './StatsCards';
import CategoriesStats from './CategoriesStats';

function Overview({ userSettings }: { userSettings: UserSettingsType }) {
	const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
		from: startOfMonth(new Date()),
		to: endOfDay(new Date()),
	});

	return (
		<>
			<div className='container flex flex-wrap items-end justify-between gap-2 py-6'>
				<h2 className='text-3xl font-bold'>Visão geral</h2>
				<div className='flex items-center gap-3'>
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
				<StatsCards userSettings={userSettings} from={dateRange.from} to={dateRange.to} />

				<CategoriesStats userSettings={userSettings} from={dateRange.from} to={dateRange.to} />
			</div>
		</>
	);
}

export default Overview;
