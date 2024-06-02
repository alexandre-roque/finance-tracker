'use client';

import InviteToTeamDialog from '@/components/InviteToTeamDialog';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import TeamsComboBox, { teamsQueryType } from '@/components/TeamsComboBox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { userSettingsType } from '@/db/schema/finance';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

type ResultQueryTeamsWithMembers = {
	id: string;
	userId: string;
	role: string;
	teamId: string;
	status: string;
	team: {
		id: string;
		name: string;
		description: string | null;
		ownerId: string;
		owner: {
			name: string | null;
		};
		members: {
			userId: string;
			role: string;
			status: string;
			user: {
				name: string;
			};
		}[];
	};
}[];

const Teams = () => {
	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const teamsQuery = useQuery<ResultQueryTeamsWithMembers>({
		queryKey: ['teams-with-members'],
		queryFn: () => fetch('/api/teams?withMembers=true').then((res) => res.json()),
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

				<SkeletonWrapper isLoading={teamsQuery.isFetching}>
					<Card>
						<CardHeader>
							<CardTitle>Times que faz parte</CardTitle>
							<CardDescription>Gerencie/visualize os times que faz parte</CardDescription>
						</CardHeader>
						<CardContent>
							<Accordion type='multiple' className='w-full'>
								<InviteToTeamDialog teamId={'01HZ3RAXV1Q19Q9Q3B3T7KFEPB'} />

								{teamsQuery.data?.map((team) => (
									<AccordionItem key={team.id} value={team.id}>
										<AccordionTrigger>
											<div className='flex flex-col justify-start text-start'>
												<span className='text-2xl'>{team.team.name}</span>
												<span className='text-muted-foreground'>{team.team.description}</span>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className='flex flex-col gap-4'>
												<AccordionItem value={`${team.id}_members`}>
													<AccordionTrigger>
														<span className='text-lg'>Membros do time</span>
													</AccordionTrigger>
													<AccordionContent>
														{(team.team.members || []).map((member) => (
															<div key={member.userId}>
																<div className='p-3 justify-between flex items-center'>
																	<p className='flex gap-1'>
																		{member.user.name}{' '}
																		{member.role !== 'member' && (
																			<p className='capitalize'>
																				({member.role})
																			</p>
																		)}
																	</p>
																	<div>
																		<Button variant='ghost'>...</Button>
																	</div>
																</div>
																<Separator />
															</div>
														))}
													</AccordionContent>
												</AccordionItem>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</CardContent>
					</Card>
				</SkeletonWrapper>
			</div>
		</>
	);
};

export default Teams;
