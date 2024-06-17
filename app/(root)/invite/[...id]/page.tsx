import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { db } from '@/db';
import { inviteTokens, teamMembers } from '@/db/schema/finance';
import { eq } from 'drizzle-orm';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Função para buscar e validar o token
async function validateTokenAndCreateTeamMember(token: string, userId: string) {
	const invite = await db.query.inviteTokens.findFirst({
		where: (inviteTokens, { eq }) => eq(inviteTokens.token, token),
	});

	if (!invite || new Date(invite.expiresAt) <= new Date()) {
		await db.delete(inviteTokens).where(eq(inviteTokens.token, token));
		return 'expired';
	}

	const team = await db.query.teams.findFirst({
		where: (teams, { eq }) => eq(teams.id, invite.teamId),
		with: {
			members: true,
		},
	});

	if (!team) {
		return 'team_not_found';
	}

	if (team.members.some((member) => member.userId === userId)) {
		return 'already_member';
	}

	await db.insert(teamMembers).values({
		userId,
		teamId: invite.teamId,
		role: 'member',
	});

	return 'success';
}

// Server Component para validação do token
export default async function InvitePage({ params: { id: token } }: { params: { id: string } }) {
	const session = await auth();
	if (!session || !session.user || !session.user.id) {
		redirect('/sign-in');
	}

	const result = await validateTokenAndCreateTeamMember(token, session.user.id);

	if (result === 'expired' || result === 'team_not_found' || result === 'already_member') {
		return (
			<div className='flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 space-y-6'>
				<div className='max-w-md w-full space-y-4 text-center'>
					<TriangleAlert className='mx-auto text-red-500 size-12' />
					<h1 className='text-3xl font-bold'>Oops, algo deu errado!</h1>
					<p className='text-gray-500 dark:text-gray-400'>
						{result === 'expired' &&
							'O token de convite é inválido ou expirou. Por favor, solicite um novo convite para participar do time!'}
						{result === 'team_not_found' && 'O time que você está tentando acessar não foi encontrado.'}
						{result === 'already_member' && 'Você já é membro deste time.'}
					</p>
					<Button asChild className='w-full'>
						<Link href='/'>Ir para início</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12 space-y-6'>
			<div className='max-w-md w-full space-y-4 text-center'>
				<CircleCheck className='mx-auto text-green-500 size-12' />
				<h1 className='text-3xl font-bold'>Bem vindo ao time</h1>
				<p className='text-gray-500 dark:text-gray-400'>
					Você já pode acessar todos os recursos e ferramentas disponíveis
				</p>
				<Button asChild className='w-full'>
					<Link href='/'>Começar a colaboradorar</Link>
				</Button>
			</div>
		</div>
	);
}
