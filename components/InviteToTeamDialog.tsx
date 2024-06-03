'use client';
import React, { useCallback, useState } from 'react';

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inviteToTeamSchema, inviteToTeamSchemaType } from '@/schemas';
import CustomInput from './CustomInput';
import { CreateTeamInvitation } from '@/app/(root)/_actions/teams';
import { Loader2 } from 'lucide-react';

function InviteToTeamDialog({ teamId }: { teamId: string }) {
	const [open, setOpen] = useState(false);

	const form = useForm<inviteToTeamSchemaType>({
		resolver: zodResolver(inviteToTeamSchema),
		defaultValues: {
			email: '',
			teamId: teamId,
		},
	});
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateTeamInvitation,
		onSuccess: (obj) => {
			if ('error' in obj) {
				toast.error(obj.error, {
					id: 'create-team-invitation',
				});
				return;
			}

			toast.success('Convite feito com sucesso 🎉', {
				id: 'create-team-invitation',
			});

			form.reset({
				email: '',
				teamId: teamId,
			});

			queryClient.invalidateQueries({
				queryKey: ['teams-invitations'],
			});

			setOpen((prev) => !prev);
		},
		onError: (err) => {
			toast.error(`Erro ao convidar`, {
				id: 'create-team-invitation',
			});
		},
	});

	const onSubmit = useCallback(
		(values: inviteToTeamSchemaType) => {
			toast.loading('Convidando para time...', {
				id: 'create-team-invitation',
			});
			mutate({ ...values, teamId });
		},
		[mutate, teamId]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Convidar para time</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Convidar para time</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<CustomInput
							control={form.control}
							name='email'
							label='Email'
							placeholder='Email de quem você deseja convidar'
						/>
					</form>
				</Form>
				<DialogFooter>
					<DialogClose asChild>
						<Button
							type='button'
							variant={'ghost'}
							onClick={() => {
								form.reset();
							}}
						>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
						{!isPending && 'Convidar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default InviteToTeamDialog;
