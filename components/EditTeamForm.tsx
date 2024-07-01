'use client';

import { ResultQueryTeamsWithMembers } from '@/app/(root)/teams/page';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { possibleSplitTypesArray, PossibleSplitTypes, editTeamSchema, editTeamSchemaType } from '@/schemas';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from './ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EditTeam } from '@/app/(root)/_actions/teams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import CustomInput from './CustomInput';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Switch } from '@/components/ui/switch';

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
			hideOnLandingPage: team.team.hideOnLandingPage || false,
			splitType: team.team.splitType as PossibleSplitTypes,
			members: team.team.members.map((member) => ({
				percentage: member.percentage,
				id: member.id,
			})),
			teamId: team.team.id,
		},
	});

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
				<CustomInput control={form.control} name='name' label='Nome' placeholder='Nome do time' />

				<CustomInput
					control={form.control}
					name='description'
					label='Descrição'
					placeholder='Descrição do time'
				/>

				<FormField
					control={form.control}
					name='hideOnLandingPage'
					render={({ field }) => (
						<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
							<div className='space-y-0.5'>
								<FormLabel className='text-base'>Não selecionar automaticamente</FormLabel>
								<FormDescription>
									Ess opção faz com que o time não seja selecionado automaticamente na tela inicial
								</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
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
