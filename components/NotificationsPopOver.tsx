'use client';

import React, { ReactNode, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pendingTeamAprovalsType } from '@/db/schema/finance';
import { toast } from 'sonner';
import { HandleTeamInvitation } from '@/app/(root)/_actions/teams';
import { Button } from './ui/button';
import { Bell, Check, X } from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

export type ResultQueryNotifications = pendingTeamAprovalsType & { teamName: string };

const NotificationsPopOver = () => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const notificationsQuery = useQuery<ResultQueryNotifications[]>({
		queryKey: ['notifications', 'teams-invitations'],
		queryFn: () => fetch('/api/notifications').then((res) => res.json()),
	});

	const handleTeamInvitationMutation = useMutation({
		mutationFn: HandleTeamInvitation,
		onSuccess: async ({ accepted }) => {
			toast.success(`Convite ${accepted ? 'aceito' : 'recusado'} com sucesso`, {
				id: 'handle-invitation',
			});

			queryClient.invalidateQueries({
				queryKey: ['notifications'],
			});

			if (accepted) {
				queryClient.invalidateQueries({
					queryKey: ['teams-members'],
				});
			}

			setOpen((prev) => !prev);
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: 'handle-invitation',
			});
		},
	});

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button className='relative' variant='secondary' size='icon'>
					<Bell className='size-4' />
					{notificationsQuery.data && notificationsQuery.data.length > 0 && (
						<Badge className='absolute -top-1.5 -right-2 flex size-6 items-center justify-center rounded-full'>
							{notificationsQuery.data.length >= 100 ? '99+' : notificationsQuery.data.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='end'>
				<div className='text-sm'>
					{notificationsQuery.data?.map((pendingTeamAproval, index) => (
						<div key={index}>
							Você foi convidado para o time {pendingTeamAproval.teamName}
							<div className='flex gap-1 justify-end mb-2'>
								<Button
									variant='destructive'
									size={'icon'}
									onClick={() => {
										handleTeamInvitationMutation.mutate({
											wasAccepted: false,
											invitation: pendingTeamAproval,
										});
									}}
								>
									<X />
								</Button>
								<Button
									className='bg-green-500 hover:bg-green-600'
									size={'icon'}
									onClick={() => {
										handleTeamInvitationMutation.mutate({
											wasAccepted: true,
											invitation: pendingTeamAproval,
										});
									}}
								>
									<Check />
								</Button>
							</div>
							<Separator />
						</div>
					))}
					{notificationsQuery.isFetching && 'Carregando...'}
					{!notificationsQuery.data || (!notificationsQuery.data.length && 'Nenhuma notificação')}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default NotificationsPopOver;
