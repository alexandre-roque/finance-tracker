'use client';

import { DeleteMacro } from '@/app/(root)/_actions/macros';
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
	macroId: string;
}

function DeleteMacroDialog({ open, setOpen, macroId }: Props) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: DeleteMacro,
		onSuccess: async () => {
			toast.success('Macro deletado com sucesso', {
				id: macroId,
			});

			queryClient.invalidateQueries({
				queryKey: ['macros'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: macroId,
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
					<AlertDialogAction
						variant={'destructive'}
						onClick={() => {
							toast.loading('Deletando transação...', {
								id: macroId,
							});
							deleteMutation.mutate({ macroId });
						}}
					>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteMacroDialog;
