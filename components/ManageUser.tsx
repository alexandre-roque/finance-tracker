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
import { Checkbox } from './ui/checkbox';

const ManageUser = () => {
	const { update, data } = useSession();
	const [name, setName] = useState(data?.user?.name ?? '');
	const [excludeProfileImage, setExcludeProfileImage] = useState(false);
	const [avatarImage, setAvatarImage] = useState(data?.user?.image ?? '');

	const { mutate, isPending } = useMutation({
		mutationFn: EditUser,
		onSuccess: async ({ error }) => {
			if (error) {
				toast.error(`Erro ao editar dados: ${error}`, {
					id: 'edit-user',
				});
				return;
			}

			toast.success('Dados editados com sucesso', {
				id: 'edit-user',
			});

			await update({ image: excludeProfileImage ? null : avatarImage, name: name });
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
					<AvatarImage src={excludeProfileImage ? '' : avatarImage} />
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
				<div className='flex items-center space-x-2 self-end'>
					<Checkbox
						checked={excludeProfileImage}
						onCheckedChange={(ev) => {
							setExcludeProfileImage(ev ? true : false);
						}}
						id='exclude-image'
					/>
					<label
						htmlFor='exclude-image'
						className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
					>
						Excluir foto de perfil
					</label>
				</div>
				<Button
					className='w-[150px] self-end'
					onClick={() => {
						toast.loading('Editando usuário', {
							id: 'edit-user',
						});

						mutate({ avatarLink: avatarImage, name: name, excludeProfileImage: excludeProfileImage });
					}}
				>
					{isPending ? <Loader2 className='animate-spin' /> : 'Salvar'}
				</Button>
			</CardContent>
		</Card>
	);
};

export default ManageUser;
