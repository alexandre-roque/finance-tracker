'use client';

import TransactionTable from '@/components/TransactionsTable';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { MAX_DATE_RANGE_DAYS } from '@/constants';
import { differenceInDays, endOfDay, startOfMonth } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

function TransactionsPage() {
	const pathname = usePathname();
	const { replace } = useRouter();
	const searchParams = useSearchParams();
	const dateRange = {
		from: new Date(searchParams.get('from') || startOfMonth(new Date()).toISOString()),
		to: new Date(searchParams.get('to') || endOfDay(new Date()).toISOString()),
	};

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

	return (
		<>
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<div>
						<p className='text-3xl font-bold'>Histórico de transações</p>
					</div>
					<DateRangePicker
						locale='pt-BR'
						initialDateFrom={dateRange.from}
						initialDateTo={dateRange.to}
						showCompare={false}
						onUpdate={(values) => {
							const { from, to } = values.range;
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
			<div className='container'>
				<TransactionTable from={dateRange.from} to={dateRange.to} />
			</div>
		</>
	);
}

export default TransactionsPage;
