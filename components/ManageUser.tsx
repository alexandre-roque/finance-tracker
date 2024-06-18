'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CircleUser, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditUser } from '@/app/(root)/_actions/user';
import { useSession } from 'next-auth/react';

const ManageUser = () => {
	const [avatarImage, setAvatarImage] = useState('');
	const [name, setName] = useState('');

	const { update } = useSession();
	const { mutate, isPending } = useMutation({
		mutationFn: EditUser,
		onSuccess: async () => {
			toast.success('Dados editados com sucesso', {
				id: 'edit-user',
			});

			update({ image: avatarImage, name: name });
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: 'edit-user',
			});
		},
	});

	return (
		<Card>
			<CardHeader className='flex flex-row justify-between'>
				<div className='w-1/2'>
					<CardTitle>Dados do usuário</CardTitle>
					<CardDescription>Altere seu nome e foto de perfil</CardDescription>
				</div>
				<Avatar>
					<AvatarImage src={avatarImage} />
					<AvatarFallback>
						<CircleUser />
					</AvatarFallback>
				</Avatar>
			</CardHeader>
			<CardContent className='flex flex-col gap-3'>
				<Label>Nome</Label>
				<div className='flex items-center justify-center gap-2'>
					<Input
						maxLength={40}
						value={name}
						onChange={(ev) => {
							setName(ev.target.value);
						}}
						placeholder='Digite o seu nome'
						className='w-full'
					/>
				</div>

				<Label>Link da imagem</Label>
				<div className='flex items-center justify-center gap-2'>
					<Input
						maxLength={300}
						value={avatarImage}
						onChange={(ev) => {
							setAvatarImage(ev.target.value);
						}}
						placeholder='https://example.com/image.jpg'
						type='url'
						className='w-full'
					/>
				</div>
				<Button
					className='w-[150px] self-end'
					onClick={() => {
						toast.loading('Editando usuário', {
							id: 'edit-user',
						});

						mutate({ avatarLink: avatarImage, name: name });
					}}
				>
					{isPending ? <Loader2 className='animate-spin' /> : 'Salvar'}
				</Button>
			</CardContent>
		</Card>
	);
};

export default ManageUser;
