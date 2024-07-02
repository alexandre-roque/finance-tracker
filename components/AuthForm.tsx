'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CustomInput from '@/components/CustomInput';
import { z } from 'zod';
import { authFormSchema } from '@/schemas';
import Link from 'next/link';

export default function AuthForm({ type }: { type: 'sign-in' | 'sign-up' }) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const formSchema = authFormSchema(type);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
			name: '',
		},
	});

	const onSubmit = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			setIsLoading(true);

			if (type === 'sign-in') {
				const result = await signIn('credentials', {
					email: values.email,
					password: values.password,
					redirect: false,
				});

				if (result?.error) {
					toast.error('Usuário não encontrado ou credenciais incorretas!');
				} else {
					router.push('/');
				}
			} else {
				const result = await fetch('/api/user', {
					method: 'POST',
					body: JSON.stringify(values),
				}).then((res) => res.json());

				if (result.errorMessage) {
					if (result.errorMessage.name === 'LibsqlError') {
						toast.error('Email duplicado, favor usar outro');
					} else {
						toast.error('Ocorreu um erro, tente novamente!');
					}
				} else {
					await signIn('credentials', {
						email: values.email,
						password: values.password,
						callbackUrl: '/',
					});
				}
			}
			setIsLoading(false);
		},
		[router, type]
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				form.handleSubmit(onSubmit)();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [form, onSubmit]);

	return (
		<div>
			<Form {...form}>
				<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
					{type === 'sign-up' && (
						<>
							<CustomInput
								control={form.control}
								name='name'
								label='Nome'
								placeholder='Digite seu nome'
							/>
						</>
					)}

					<CustomInput control={form.control} name='email' label='Email' placeholder='Digite seu e-mail' />

					<CustomInput
						control={form.control}
						name='password'
						label='Senha'
						placeholder='Digite sua senha'
						type='password'
						isPassword
					/>
				</form>
			</Form>
			<Button disabled={isLoading} onClick={form.handleSubmit(onSubmit)} className='w-full mt-6'>
				{isLoading ? <Loader2 className='animate-spin' /> : type === 'sign-in' ? 'Entrar' : 'Cadastrar'}
			</Button>

			<footer className='flex justify-center gap-2 mt-4'>
				<p className='text-14 font-normal text-gray-600'>
					{type === 'sign-in' ? 'Deseja realizar cadastro?' : 'Já possui uma conta?'}
				</p>
				<Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className='form-link underline'>
					{type === 'sign-in' ? 'Cadastrar' : 'Entrar'}
				</Link>
			</footer>
		</div>
	);
}
