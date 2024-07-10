'use client';
import React, { useState } from 'react';

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CopyCheck, Loader2 } from 'lucide-react';
import { createInviteLink } from '@/app/(root)/_actions/teamInvite';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';

function InviteToTeamDialog({ teamId }: { teamId: string }) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [link, setLink] = useState('');

	const handleGenerate = async () => {
		setIsLoading(true);
		const { data, error } = await createInviteLink(teamId);
		if (error) toast.error(`Erro ao gerar o link: ${error}`);
		if (data) setLink(data);
		setIsLoading(false);
	};
	const handleCopy = () => {
		setCopied(true);
		toast.success('Link copiado para a área de transferência');
		navigator.clipboard.writeText(link);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Convidar por link</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Convidar por link</DialogTitle>
				</DialogHeader>
				<div className='flex items-center gap-2'>
					<Textarea id='link' placeholder='O link gerado aparecerá aqui' value={link} readOnly />
					<Button variant='ghost' size='icon' onClick={handleCopy} onMouseLeave={() => setCopied(false)}>
						{copied ? <CopyCheck className='size-4' /> : <Copy className='size-4' />}
						<span className='sr-only'>Copy</span>
					</Button>
				</div>
				<Button type='button' onClick={handleGenerate} className='w-full'>
					{isLoading ? (
						<div className='flex gap-2 items-center'>
							<Loader2 className='w-6 h-6 animate-spin' /> Gerando...
						</div>
					) : (
						'Gerar link'
					)}
				</Button>
				<DialogClose asChild>
					<Button type='button' variant={'ghost'}>
						Cancelar
					</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
}

export default InviteToTeamDialog;
