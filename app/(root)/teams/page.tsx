'use client';

import SkeletonWrapper from '@/components/SkeletonWrapper';
import TeamsComboBox from '@/components/TeamsComboBox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const Teams = () => {
	const userSettingsQuery = useQuery({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	return (
		<>
			<div className='border-b bg-card'>
				<div className='container flex flex-wrap items-center justify-between gap-6 py-8'>
					<div>
						<p className='text-3xl font-bold'>Gerenciar</p>
						<p className='text-muted-foreground'>Gerencie seus times e configurações</p>
					</div>
				</div>
			</div>
			<div className='container flex flex-col gap-4 p-4'>
				<SkeletonWrapper isLoading={userSettingsQuery.isFetching}>
					<Card>
						<CardHeader>
							<CardTitle>Time principal</CardTitle>
							<CardDescription>Selecione seu time padrão para transações</CardDescription>
						</CardHeader>
						<CardContent>
							<TeamsComboBox userSettings={userSettingsQuery.data} isConfiguring />
						</CardContent>
					</Card>
				</SkeletonWrapper>
			</div>
		</>
	);
};

export default Teams;
