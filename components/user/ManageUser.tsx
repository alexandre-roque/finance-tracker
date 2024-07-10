'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CircleUser, Loader2, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditUser, getSignedURL } from '@/app/(root)/_actions/user';
import { useSession } from 'next-auth/react';
import { Checkbox } from '../ui/checkbox';
import { computeSHA256 } from '@/lib/utils';

const ManageUser = () => {
	const { update, data } = useSession();
	const [name, setName] = useState(data?.user?.name ?? '');
	const [excludeProfileImage, setExcludeProfileImage] = useState(false);
	const [avatarImage, setAvatarImage] = useState(data?.user?.image ?? '');
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setFile(file);
		if (avatarImage) {
			URL.revokeObjectURL(avatarImage);
		}
		if (file) {
			const url = URL.createObjectURL(file);
			setAvatarImage(url);
		} else {
			setAvatarImage('');
		}
	};

	const { mutate, isPending } = useMutation({
		mutationFn: EditUser,
		onSuccess: async ({ error, success }) => {
			if (error) {
				toast.error(`Erro ao editar dados: ${error}`, {
					id: 'edit-user',
				});
				return;
			} else if (success) {
				toast.success('Dados editados com sucesso', {
					id: 'edit-user',
				});

				setFile(null);
				setAvatarImage('');

				await update({ image: success.image, name: success.name });
			}
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: 'edit-user',
			});
		},
	});

	const handleFileUpload = async (file: File) => {
		const signedURLResult = await getSignedURL({
			fileSize: file.size,
			fileType: file.type,
			checksum: await computeSHA256(file),
		});

		if (signedURLResult.failure !== undefined) {
			throw new Error(signedURLResult.failure);
		}

		const { url } = signedURLResult.success;

		await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': file.type,
			},
			body: file,
		});

		return url.split('?')[0];
	};

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

				<div className='flex  lg:flex-row flex-col gap-2 w-full'>
					<div className=' lg:w-[63%] w-full'>
						<Label>Link da imagem</Label>
						<div className='flex items-center justify-center gap-2'>
							<Input
								disabled={excludeProfileImage || file != null}
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
					</div>
					<div>
						<Label>Arquivo</Label>
						<div className='flex items-center justify-center gap-2'>
							<Input
								disabled={excludeProfileImage}
								onChange={handleFileChange}
								type='file'
								className='w-full'
								accept='image/jpeg,image/png,image/webp,image/jpg'
								ref={fileInputRef}
							/>
							<Button
								onClick={() => {
									if (file) {
										setFile(null);
										setAvatarImage('');
										if (fileInputRef.current) {
											fileInputRef.current.value = '';
										}
									}
								}}
								size={'icon'}
								variant={'ghost'}
							>
								<Trash2 />
							</Button>
						</div>
					</div>
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
					onClick={async () => {
						toast.loading('Editando usuário', {
							id: 'edit-user',
						});

						let url = '';
						if (!excludeProfileImage && file) {
							setIsUploading(true);
							toast.loading('Enviando imagem', {
								id: 'handle-file',
							});

							try {
								url = await handleFileUpload(file);
							} catch (e) {
								toast.error(`Erro ao enviar imagem: ${e}`, {
									id: 'handle-file',
								});

								toast.error('Erro ao editar usuário', {
									id: 'edit-user',
								});
								return;
							} finally {
								setIsUploading(false);
							}

							setAvatarImage(url);

							toast.success('Imagem enviada com sucesso', {
								id: 'handle-file',
							});
						}

						if (excludeProfileImage) {
							mutate({ avatarLink: '', name: name, excludeProfileImage: excludeProfileImage });
						} else {
							mutate({
								avatarLink: file ? url : avatarImage,
								name: name,
								excludeProfileImage: excludeProfileImage,
							});
						}
					}}
				>
					{isPending || isUploading ? <Loader2 className='animate-spin' /> : 'Salvar'}
				</Button>
			</CardContent>
		</Card>
	);
};

export default ManageUser;
