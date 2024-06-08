'use client';

import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	PossibleRoles,
	PossibleStatus,
	editTeamMemberSchema,
	editTeamMemberSchemaType,
	possibleRolesArray,
	possibleStatusArray,
} from '@/schemas';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMembersType } from '@/db/schema/finance';
import { EditTeamMember } from '@/app/(root)/_actions/teams';
import { ROLE_MAP, STATUS_MAP } from './TeamMembersTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EditBankingAccountForm = ({
	setIsOpen,
	teamMember,
}: {
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	teamMember: teamMembersType;
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<editTeamMemberSchemaType>({
		resolver: zodResolver(editTeamMemberSchema),
		defaultValues: {
			role: teamMember.role as PossibleRoles | undefined,
			status: teamMember.status as PossibleStatus | undefined,
			teamMemberId: teamMember.id,
		},
	});
	const { mutate, isPending } = useMutation({
		mutationFn: EditTeamMember,
		onSuccess: async ({ error }) => {
			if (error) {
				toast.error(`Algo deu errado: ${error}`, {
					id: 'edit-team-member',
				});
				return;
			}

			toast.success(`Membro editado com sucesso 🎉`, {
				id: 'edit-team-member',
			});

			queryClient.invalidateQueries({
				queryKey: ['teams-with-members'],
			});

			setIsOpen((prev) => !prev);
		},
		onError: (e) => {
			toast.error(`Algo deu errado: ${e.message}`, {
				id: 'edit-team-member',
			});
		},
	});

	const onSubmit = useCallback(
		(values: editTeamMemberSchemaType) => {
			toast.loading('Editando membro...', {
				id: 'edit-team-member',
			});
			mutate({
				...values,
				teamMemberId: teamMember.id,
			});
		},
		[mutate, teamMember.id]
	);

	return (
		<Form {...form}>
			<form className='flex flex-col gap-3 space-y-2 md:px-0 px-4' onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name='role'
					render={() => (
						<FormItem className='flex flex-col'>
							<FormLabel className='pb-2'>Cargo</FormLabel>
							<FormControl>
								<Select
									onValueChange={(value) => {
										form.setValue('role', value as PossibleRoles);
									}}
									value={form.getValues('role')}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Selecionar cargo' />
									</SelectTrigger>
									<SelectContent>
										{possibleRolesArray
											.filter((role) => role !== 'owner')
											.map((role, i) => {
												return (
													<SelectItem key={i} value={role}>
														{ROLE_MAP[role as keyof typeof ROLE_MAP]}
													</SelectItem>
												);
											})}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='status'
					render={() => (
						<FormItem className='flex flex-col'>
							<FormLabel className='pb-2'>Cargo</FormLabel>
							<FormControl>
								<Select
									onValueChange={(value) => {
										form.setValue('status', value as PossibleStatus);
									}}
									value={form.getValues('status')}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Selecionar status' />
									</SelectTrigger>
									<SelectContent>
										{possibleStatusArray.map((status, i) => {
											return (
												<SelectItem key={i} value={status}>
													{STATUS_MAP[status as keyof typeof STATUS_MAP]}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>
				<Button type='submit' disabled={isLoading} className='w-full sm:w-auto'>
					<>
						{isLoading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Editando...
							</>
						) : (
							'Editar'
						)}
					</>
				</Button>
			</form>
		</Form>
	);
};

export default EditBankingAccountForm;
