'use client';

import { DeleteInvoice } from '@/app/(root)/_actions/invoices';
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
import { creditCardInvoicesType, teamsType } from '@/db/schema/finance';
import { TransactionType } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
	trigger: ReactNode;
	invoice: creditCardInvoicesType;
}

function DeleteTeamDialog({ invoice, trigger }: Props) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: DeleteInvoice,
		onSuccess: ({ error }) => {
			if (error) {
				toast.error(`Erro ao deletar fatura: ${error}`, {
					id: invoice.id,
				});
				return;
			}

			queryClient.invalidateQueries({
				queryKey: ['invoices'],
			});

			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});

			toast.success('Fatura deletada com sucesso', {
				id: invoice.id,
			});
		},
		onError: () => {
			toast.error('Erro ao deletar fatura', {
				id: invoice.id,
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
						Essa ação não pode ser revertida. A fatura será deletada para sempre
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant='destructive'
						onClick={() => {
							toast.loading('Deletando fatura...', {
								id: invoice.id,
							});
							deleteMutation.mutate({
								invoiceId: invoice.id,
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
