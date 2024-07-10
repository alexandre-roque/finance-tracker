'use client';

import { DeleteTeam } from '@/app/(root)/_actions/teams';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { teamsType } from '@/db/schema/finance';
import { TransactionType } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
	trigger: ReactNode;
	team: teamsType;
}

function DeleteTeamDialog({ team, trigger }: Props) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: DeleteTeam,
		onSuccess: async ({ error }) => {
			if (error) {
				toast.error(error, {
					id: team.id,
				});
				return;
			}

			toast.success('Time deletado com sucesso', {
				id: team.id,
			});

			queryClient.invalidateQueries({
				queryKey: ['teams-with-members'],
			});

			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: team.id,
			});
		},
	});

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação não pode ser revertida. O time será deletado para sempre
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant='destructive'
						onClick={() => {
							toast.loading('Deletando time...', {
								id: team.id,
							});
							deleteMutation.mutate({
								teamId: team.id,
							});
						}}
					>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteTeamDialog;
