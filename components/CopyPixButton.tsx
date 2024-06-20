'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Copy, CopyCheck } from 'lucide-react';

const CopyPixButton = () => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		setCopied(true);
		toast.success('Link copiado para a área de transferência', {
			id: 'copy-pix',
		});
		navigator.clipboard.writeText(
			'00020101021126580014br.gov.bcb.pix013676faee2b-e50a-4c9e-95c2-92721b19c9845204000053039865802BR5925ALEXANDRE ROQUE SILVA DE 6009SAO PAULO622905251J0TP1FSX7GBRC0ST33ZMEMQP63047DD6'
		);
	};

	return (
		<Button
			variant='outline'
			className='w-full hover:bg-muted-foreground hover:text-secondary'
			onClick={handleCopy}
			onMouseLeave={() => setCopied(false)}
		>
			{copied ? (
				<>
					<CopyCheck className='size-4' /> Copiado!
				</>
			) : (
				<>
					<Copy className='size-4' /> Copiar código
				</>
			)}
		</Button>
	);
};

export default CopyPixButton;
