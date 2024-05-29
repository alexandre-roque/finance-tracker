'use client';

import { DeleteCategory } from '@/app/(root)/_actions/categories';
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
import { categoriesType } from '@/db/schema/finance';
import { TransactionType } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
	trigger: ReactNode;
	category: categoriesType;
}

function DeleteCategoryDialog({ category, trigger }: Props) {
	const categoryIdentifier = `${category.name}-${category.type}`;
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: DeleteCategory,
		onSuccess: async () => {
			toast.success('Categoria deletada com sucesso', {
				id: categoryIdentifier,
			});

			await queryClient.invalidateQueries({
				queryKey: ['categories'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: categoryIdentifier,
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
						Essa ação não pode ser revertida. A categoria será deletada para sempre
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							toast.loading('Deletando categoria...', {
								id: categoryIdentifier,
							});
							deleteMutation.mutate({
								name: category.name,
								type: category.type as TransactionType,
							});
						}}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteCategoryDialog;
