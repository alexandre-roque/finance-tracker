'use client';

import { ResultQueryTeamsWithMembers } from '@/app/(root)/teams/page';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { possibleSplitTypesArray, PossibleSplitTypes, editTeamSchema, editTeamSchemaType } from '@/schemas';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EditTeam, EditTeamMember } from '@/app/(root)/_actions/teams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import CustomInput from './CustomInput';
import { useSession } from 'next-auth/react';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export const SPLIT_TYPE_MAP = {
	percentage: 'Porcentagem',
	none: 'Nenhum',
};

const EditTeamForm = ({
	team,
	setIsOpen,
}: {
	team: ResultQueryTeamsWithMembers;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const queryClient = useQueryClient();

	const form = useForm<editTeamSchemaType>({
		resolver: zodResolver(editTeamSchema),
		defaultValues: {
			name: team.team.name,
			description: team.team.description || '',
			splitType: team.team.splitType as PossibleSplitTypes,
			members: team.team.members.map((member) => ({
				percentage: member.percentage,
				id: member.id,
			})),
			teamId: team.team.id,
		},
	});

	const { errors } = form.formState;

	const splitTypeValue = form.watch('splitType');

	const { mutate, isPending } = useMutation({
		mutationFn: EditTeam,
		onSuccess: async ({ error }) => {
			if (error) {
				toast.error(`Algo deu errado: ${error}`, {
					id: 'edit-team',
				});
				return;
			}

			toast.success(`Time com sucesso 🎉`, {
				id: 'edit-team',
			});

			queryClient.invalidateQueries({
				queryKey: ['teams-with-members'],
			});

			setIsOpen((prev) => !prev);
		},
		onError: (e) => {
			toast.error(`Algo deu errado: ${e.message}`, {
				id: 'edit-team',
			});
		},
	});

	const onSubmit = useCallback(
		(values: editTeamSchemaType) => {
			toast.loading('Editando time...', {
				id: 'edit-team',
			});

			mutate({
				...values,
				teamId: team.team.id,
			});
		},
		[mutate, team.team.id]
	);

	return (
		<Form {...form}>
			<form className='flex flex-col gap-3 space-y-2 md:px-0 px-4' onSubmit={form.handleSubmit(onSubmit)}>
				<CustomInput
					control={form.control}
					name='name'
					label='Nome'
					placeholder='Nome do time'
				/>

				<CustomInput
					control={form.control}
					name='description'
					label='Descrição'
					placeholder='Descrição do time'
				/>

				<FormField
					control={form.control}
					name='splitType'
					render={() => (
						<FormItem className='flex flex-col'>
							<FormLabel className='pb-2'>Tipo de divisão</FormLabel>
							<FormControl>
								<Select
									onValueChange={(value) => {
										form.setValue('splitType', value as PossibleSplitTypes);
									}}
									value={form.getValues('splitType')}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Selecionar tipo' />
									</SelectTrigger>
									<SelectContent>
										{possibleSplitTypesArray.map((type, i) => {
											return (
												<SelectItem key={i} value={type}>
													{SPLIT_TYPE_MAP[type as keyof typeof SPLIT_TYPE_MAP]}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>

				{splitTypeValue === 'percentage' && (
					<Accordion type='single' collapsible>
						<AccordionItem value='item-1'>
							<AccordionTrigger>Divisão de porcentagem</AccordionTrigger>
							<AccordionContent className='flex flex-col gap-2'>
								{team.team.members.map((member, index) => (
									<div key={member.id}>
										<label>{member.user.name} (%)</label>
										<Controller
											name={`members.${index}.percentage`}
											control={form.control}
											render={({ field }) => (
												<Input type='number' step='0.01' min={0} max={100} {...field} />
											)}
										/>
									</div>
								))}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				)}

				<Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
					<>
						{isPending ? (
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

export default EditTeamForm;
