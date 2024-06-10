'use client';

import EditTeamForm from '@/components/EditTeamForm';
import InviteToTeamDialog from '@/components/InviteToTeamDialog';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import TeamMembersTable from '@/components/TeamMembersTable';
import TeamsComboBox from '@/components/TeamsComboBox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { userSettingsType } from '@/db/schema/finance';
import { useQuery } from '@tanstack/react-query';
import { Cog } from 'lucide-react';
import React, { useState } from 'react';

export type ResultQueryTeamsWithMembers = {
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
		splitType: string;
		members: {
			teamId: string;
			id: string;
			userId: string;
			role: string;
			status: string;
			percentage: number;
			user: {
				name: string;
				id: string;
			};
		}[];
	};
};

const Teams = () => {
	const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings', { type: 'manage' }],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});

	const teamsQuery = useQuery<ResultQueryTeamsWithMembers[]>({
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
								{teamsQuery.data?.map((team) => (
									<AccordionItem key={team.id} value={team.id}>
										<AccordionTrigger>
											<div className='flex flex-col justify-start text-start'>
												<span className='text-2xl'>{team.team.name}</span>
												<span className='text-muted-foreground'>{team.team.description}</span>
											</div>
										</AccordionTrigger>
										<AccordionContent className='flex flex-col'>
											<div className='flex justify-between items-center'>
												<InviteToTeamDialog teamId={team.team.id} />
												<Button
													variant='secondary'
													className='flex items-center gap-2'
													onClick={() => {
														setIsEditTeamDialogOpen(true);
													}}
												>
													<Cog /> Editar time
												</Button>
											</div>
											<ResponsiveDialog
												title='Editar time'
												isOpen={isEditTeamDialogOpen}
												setIsOpen={setIsEditTeamDialogOpen}
											>
												<EditTeamForm
													setIsOpen={setIsEditTeamDialogOpen}
													team={team}
												></EditTeamForm>
											</ResponsiveDialog>

											<div className='flex flex-col gap-4'>
												<AccordionItem value={`${team.id}_members`}>
													<AccordionTrigger>
														<span className='text-lg'>Membros do time</span>
													</AccordionTrigger>
													<AccordionContent>
														<TeamMembersTable data={team.team.members} />
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
