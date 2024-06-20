/**
 * v0 by Vercel.
 * @see https://v0.dev/t/E5BMGHWPeyV
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import CopyPixButton from '@/components/CopyPixButton';

export default function Component() {
	return (
		<div className='flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground'>
			<div className='container max-w-4xl px-4 py-12 md:py-24'>
				<div className='space-y-6 text-center'>
					<div className='space-y-2'>
						<h1 className='text-4xl font-bold tracking-tighter md:text-5xl'>Ajude o meu trabalho</h1>
						<p className='text-muted-foreground md:text-xl'>
							Sua contribuição me ajuda a continuar criando conteúdo e recursos valiosos.
						</p>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<Card className='p-6 bg-muted rounded-lg'>
							<CardHeader>
								<CardTitle>Compre um café para mim</CardTitle>
								<CardDescription>Mostre a sua apreciação com uma doação única</CardDescription>
							</CardHeader>
							<CardContent className='flex items-center justify-center'>
								<Image src='/pix-qr-code.jpeg' alt='Coffee' width={300} height={300} />
							</CardContent>
							<CardFooter>
								<CopyPixButton />
							</CardFooter>
						</Card>
						<Card className='p-6 bg-muted rounded-lg'>
							<CardHeader>
								<CardTitle>Sobre o criador</CardTitle>
								<CardDescription>Aprenda um pouco mais sobre quem sou</CardDescription>
							</CardHeader>
							<CardContent className='flex items-center justify-center'>
								<div className='space-y-4'>
									<Image
										src='/buy-me-a-coffe.jpg'
										alt='Alexandre Roque'
										width={400}
										height={400}
										className='rounded-full'
									/>
									<div className='space-y-2'>
										<h3 className='text-2xl font-bold'>Alexandre Roque</h3>
										<p className='text-muted-foreground'>
											Sou um criador que gosta de compartilhar conhecimento e experiência com o
											mundo.
										</p>
										<p className='text-muted-foreground'>
											A sua contribuição me ajuda a continuar produzindo conteúdo e recursos
											úteis.
										</p>
										<p className='text-muted-foreground'>
											Caso aprecie meu trabalho, considere me oferecer um café. Obrigado pelo
											apoio!
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
