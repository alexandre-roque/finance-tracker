'use client';

import { userSettingsType } from '@/db/schema/finance';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { EditUserSettings } from '@/app/(root)/_actions/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ManageUserSettings = ({ userSettings }: { userSettings: userSettingsType | undefined }) => {
	const [isAnimationDisabled, setIsAnimationDisabled] = useState(userSettings?.disableAnimations ?? false);
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: EditUserSettings,
		onSuccess: async ({ error, success }) => {
			if (error) {
				toast.error(`Erro ao editar dados: ${error}`, {
					id: 'edit-user-settings',
				});
				return;
			} else if (success) {
				toast.success('Dados editados com sucesso', {
					id: 'edit-user-settings',
				});
			}
			queryClient.invalidateQueries({
				queryKey: ['user-settings'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: 'edit-user-settings',
			});
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configurações gerais</CardTitle>
				<CardDescription>Configure sua experiência no site</CardDescription>
			</CardHeader>
			<CardContent className='flex flex-col gap-3'>
				<div className='flex flex-row items-center justify-between rounded-lg border p-4'>
					<div>
						<Label className='font-bold text-lg'>Desabilitar animações</Label>
						<p className='text-muted-foreground w-[90%]'>
							Desabilita todas as animações do site, retirando os valores subindo toda vez que a página é
							carregada, ou uma transação é feita
						</p>
					</div>
					<Switch
						checked={isAnimationDisabled}
						onCheckedChange={() => setIsAnimationDisabled((prev) => !prev)}
					/>
				</div>
				<Button
					className='w-28 self-end'
					onClick={() => {
						toast.loading('Editando dados...', {
							id: 'edit-user-settings',
						});
						mutate({ disableAnimations: isAnimationDisabled });
					}}
				>
					{isPending ? <Loader2 className='h-5 w-5 animate-spin' /> : 'Salvar'}
				</Button>
			</CardContent>
		</Card>
	);
};

export default ManageUserSettings;
