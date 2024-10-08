'use client';
import { GetTotalBalanceStatsResponseType } from '@/app/api/stats/total-balance/route';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from './StatsCards';
import { AlarmClock, CircleArrowRight, CreditCard, Wallet2 } from 'lucide-react';
import SkeletonWrapper from '../common/SkeletonWrapper';

const TotalBalanceAndCreditStats = ({
	disableAnimations,
	formatter,
}: {
	disableAnimations: boolean;
	formatter: Intl.NumberFormat;
}) => {
	const totalBalanceAndCreditQuery = useQuery<GetTotalBalanceStatsResponseType>({
		queryKey: ['overview', 'total-balance-and-credit'],
		queryFn: () => fetch('/api/stats/total-balance').then((res) => res.json()),
	});

	return (
		<div className='relative flex w-full flex-wrap gap-2 md:flex-nowrap'>
			<SkeletonWrapper isLoading={totalBalanceAndCreditQuery.isPending}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					title='Valor em conta(s)'
					value={parseFloat(totalBalanceAndCreditQuery.data?.balance.value ?? '0')}
					icon={
						<Wallet2 className='h-12 w-12 items-center rounded-lg p-2 text-violet-500 bg-violet-400/10' />
					}
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={totalBalanceAndCreditQuery.isPending}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					title='Fatura atual'
					value={totalBalanceAndCreditQuery.data?.currentCredit.value ?? 0}
					icon={<AlarmClock className='h-12 w-12 items-center rounded-lg p-2 text-red-500 bg-red-400/10' />}
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={totalBalanceAndCreditQuery.isPending}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					title='Próxima fatura'
					value={totalBalanceAndCreditQuery.data?.nextCredit.value ?? 0}
					icon={
						<CircleArrowRight className='h-12 w-12 items-center rounded-lg p-2 text-amber-500 bg-amber-400/10' />
					}
				/>
			</SkeletonWrapper>

			<SkeletonWrapper isLoading={totalBalanceAndCreditQuery.isPending}>
				<StatCard
					disableAnimations={disableAnimations}
					formatter={formatter}
					title='Todas as faturas'
					value={parseFloat(totalBalanceAndCreditQuery.data?.totalCredit.value ?? '0')}
					icon={
						<CreditCard className='h-12 w-12 items-center rounded-lg p-2 text-orange-500 bg-orange-400/10' />
					}
				/>
			</SkeletonWrapper>
		</div>
	);
};

export default TotalBalanceAndCreditStats;
