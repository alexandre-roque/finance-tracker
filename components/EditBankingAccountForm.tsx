'use client';

import React, { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBankingAccountSchema as formSchema } from '@/schemas';
import { z } from 'zod';
import { Form } from './ui/form';
import CustomInput from './CustomInput';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const EditBankingAccountForm = ({
	setIsOpen,
	bankingAccountId,
}: {
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	bankingAccountId: string;
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
			bankingAccountId,
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);

		toast.loading('Editando conta bancária', {
			id: 'creating-banking-account',
		});

		await fetch('/api/banking-accounts', {
			method: 'POST',
			body: JSON.stringify({
				name: values.name,
				number: values.description,
				bankingAccountId,
			}),
		}).then((res) => {
			if (res.status === 200) {
				toast.success('Conta bancária editada com sucesso', {
					id: 'creating-banking-account',
				});

				queryClient.invalidateQueries({
					queryKey: ['banking-accounts'],
				});
			} else {
				toast.error('Erro ao criar conta bancária', {
					id: 'creating-banking-account',
				});
			}
		});

		setIsLoading(false);
		setIsOpen(false);
	};

	return (
		<Form {...form}>
			<form className='flex flex-col space-y-2 md:px-0 px-4' onSubmit={form.handleSubmit(onSubmit)}>
				<CustomInput
					control={form.control}
					name='name'
					label='Nome'
					placeholder='Digite o nome que você quer dar'
				/>

				<CustomInput
					control={form.control}
					name='description'
					label='Descrição'
					placeholder='Exemplo: Conta da Nubank'
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
