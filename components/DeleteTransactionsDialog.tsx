'use client';

import { DeleteTransaction } from '@/app/(root)/_actions/transactions';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	transactionId: string;
	installmentId?: string | null;
	isRecurrent?: boolean;
}

function DeleteTransactionDialog({ open, setOpen, transactionId, installmentId, isRecurrent }: Props) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: DeleteTransaction,
		onSuccess: async () => {
			toast.success('Transação deletada com sucesso', {
				id: transactionId,
			});

			if (isRecurrent) {
				queryClient.invalidateQueries({
					queryKey: ['recurrent-transactions'],
				});
			} else {
				queryClient.invalidateQueries({
					queryKey: ['overview'],
				});

				queryClient.invalidateQueries({
					queryKey: ['transactions'],
				});
			}
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: transactionId,
			});
		},
	});
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Você tem certeza disso?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação não pode ser revertida. Isso deletará a transação para sempre
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					{installmentId && (
						<AlertDialogAction
							onClick={() => {
								toast.loading('Deletando transações...', {
									id: transactionId,
								});
								deleteMutation.mutate({ transactionId, installmentId });
							}}
						>
							Apagar todas as parcelas
						</AlertDialogAction>
					)}
					<AlertDialogAction
						onClick={() => {
							toast.loading('Deletando transação...', {
								id: transactionId,
							});
							deleteMutation.mutate({ transactionId, isRecurrent });
						}}
					>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteTransactionDialog;
