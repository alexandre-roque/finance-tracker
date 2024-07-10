'use server';

import React from 'react';
import { Button } from '../ui/button';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function revalidateAndRedirect() {
	revalidatePath('/');
	redirect('/');
}

const RevalidateAndRedirect = () => {
	return (
		<form action={revalidateAndRedirect}>
			<Button type='submit'>Tudo certo! Leve-me para página inicial</Button>
		</form>
	);
};

export default RevalidateAndRedirect;
