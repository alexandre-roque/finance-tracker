'use client';
import React, { useCallback, useEffect } from 'react';

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionType } from '@/lib/utils';
import {
	PossiblePaymentTypes,
	createOrEditMacroSchema,
	createOrEditMacroSchemaType,
	possiblePaymentTypesArray,
} from '@/schemas';
import CustomInput from '../common/CustomInput';
import CategoryPicker from '../category/CategoryPicker';
import { macroType } from '@/db/schema/finance';
import TeamsComboBox from '../team/TeamsComboBox';
import { PAYMENT_TYPES_MAP } from './CreateTransactionDialog';
import BankingAccountComboBox from '../bankingAccount/BankingAccountComboBox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CreateOrEditMacro } from '@/app/(root)/_actions/macros';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	macro?: macroType;
}

function EditMacroDialog({ open, setOpen, macro }: Props) {
	const form = useForm<createOrEditMacroSchemaType>({
		resolver: zodResolver(createOrEditMacroSchema),
		defaultValues: {
			name: macro?.name || '',
			type: 'expense' as TransactionType,
			description: macro?.description || '',
			teamId: macro?.teamId || undefined,
			amount: macro?.amount || undefined,
			categoryId: macro?.categoryId || undefined,
			bankingAccountId: macro?.bankingAccountId ?? undefined,
			paymentType: (macro?.paymentType as PossiblePaymentTypes) ?? undefined,
			macroId: macro?.id,
		},
	});

	const isOnlyDebit = form.watch('isOnlyDebit');

	useEffect(() => {
		if (isOnlyDebit) {
			form.setValue('paymentType', 'debit');
		}
	}, [isOnlyDebit, form]);

	const handleCategoryChange = useCallback(
		(value: string) => {
			form.setValue('categoryId', value);
		},
		[form]
	);

	const handleTeamChange = useCallback(
		(value?: string) => {
			form.setValue('teamId', value);
		},
		[form]
	);

	const handleBankingAccountChange = useCallback(
		(value: string, isOnlyDebit: boolean) => {
			form.setValue('bankingAccountId', value);
			form.setValue('isOnlyDebit', isOnlyDebit);
		},
		[form]
	);

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: CreateOrEditMacro,
		onSuccess: (obj) => {
			if (obj && 'error' in obj) {
				toast.error(obj.error, {
					id: 'macro',
				});
				return;
			}

			if (macro) {
				toast.success('Macro editado com sucesso 🎉', {
					id: 'macro',
				});
			} else {
				toast.success('Macro criado com sucesso 🎉', {
					id: 'macro',
				});
			}

			form.reset({
				description: '',
				bankingAccountId: '',
				amount: 0,
			});

			queryClient.invalidateQueries({
				queryKey: ['macros'],
			});

			setOpen(false);
		},
		onError: (err) => {
			toast.error(`Erro ao editar macro ${err.message}`, {
				id: 'macro',
			});
		},
	});

	const onSubmit = useCallback(
		(values: createOrEditMacroSchemaType) => {
			toast.loading(`${macro?.id ? 'Editando' : 'Criando'} macro...`, { id: 'macro' });
			mutate({
				...values,
				macroId: macro?.id,
			});
		},
		[mutate, macro?.id]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{macro?.id ? 'Editar' : 'Criar'} macro</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
						<CustomInput
							control={form.control}
							name='name'
							label='Nome'
							placeholder='Digite o nome do macro'
						/>
						<CustomInput
							control={form.control}
							name='description'
							label='Descrição'
							placeholder='Digite a descrição do macro'
						/>
						<FormField
							control={form.control}
							name='teamId'
							render={() => (
								<FormItem className='flex flex-col'>
									<FormLabel>Time</FormLabel>
									<FormControl>
										<TeamsComboBox firstSelectedValue={macro?.teamId} onChange={handleTeamChange} />
									</FormControl>
									<FormDescription>Selecione o time para o macro</FormDescription>
								</FormItem>
							)}
						/>

						<div className='flex items-center gap-2'>
							<FormField
								control={form.control}
								name='categoryId'
								render={() => (
									<FormItem className='flex flex-col w-1/2'>
										<FormLabel>Categoria</FormLabel>
										<FormControl>
											<CategoryPicker
												firstSelectedValue={macro?.categoryId}
												type={'expense'}
												onChange={handleCategoryChange}
											/>
										</FormControl>
										<FormDescription>Selecione a categoria do seu macro</FormDescription>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='bankingAccountId'
								render={() => (
									<FormItem className='flex flex-col'>
										<FormLabel>Conta bancária</FormLabel>
										<FormControl>
											<BankingAccountComboBox
												firstSelectedValue={macro?.bankingAccountId}
												onChange={handleBankingAccountChange}
											/>
										</FormControl>
										<FormDescription>Selecione a conta bancária do seu macro</FormDescription>
									</FormItem>
								)}
							/>
						</div>

						<div className='flex items-center gap-2'>
							<CustomInput control={form.control} name='amount' label='Valor' type='number' />
							<FormField
								control={form.control}
								name='paymentType'
								render={() => (
									<FormItem className='flex flex-col w-1/2'>
										<FormLabel className='pb-2'>Tipo de pagamento</FormLabel>
										<FormControl>
											<Select
												disabled={isOnlyDebit}
												onValueChange={(value) => {
													form.setValue('paymentType', value as PossiblePaymentTypes);
												}}
												value={form.getValues('paymentType')}
											>
												<SelectTrigger className='w-full'>
													<SelectValue placeholder='Selecionar tipo' />
												</SelectTrigger>
												<SelectContent>
													{possiblePaymentTypesArray.map((type, i) => {
														return (
															<SelectItem key={i} value={type}>
																{
																	PAYMENT_TYPES_MAP[
																		type as keyof typeof PAYMENT_TYPES_MAP
																	]
																}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>

				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='ghost' onClick={() => {}}>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
						{!isPending && (macro?.id ? 'Atualizar' : 'Criar')}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default EditMacroDialog;
