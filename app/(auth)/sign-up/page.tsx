import AuthForm from '@/components/common/AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SignUp = async () => {
	return (
		<main className='flex min-h-screen flex-col items-center justify-between lg:p-24 p-6 bg-pokeRed'>
			<Card>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl'>Crie sua conta</CardTitle>
					<CardDescription>Insira seu e-mail abaixo para criar a sua conta</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-4'>
					<AuthForm type='sign-up' />
				</CardContent>
			</Card>
		</main>
	);
};

export default SignUp;
