import Image from 'next/image';
import CopyPixButton from '@/components/common/CopyPixButton';
import Link from 'next/link';
import { Icons } from '@/components/ui/icons';
import { Mail } from 'lucide-react';

export default function About() {
	return (
		<div className='flex flex-col min-h-dvh'>
			<section className='w-full p-6 md:p-12 lg:p-16 border-b'>
				<div className='container space-y-10 xl:space-y-16 px-4 md:px-6'>
					<div className='grid gap-4 md:grid-cols-2 md:gap-16'>
						<div>
							<h1 className='lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]'>
								Sobre o criador
							</h1>
						</div>
						<div className='flex flex-col items-start space-y-4'>
							<div className='inline-block rounded-lg bg-muted px-3 py-1 text-sm'>Background</div>
							<p className='mx-auto max-w-[700px] text-muted-foreground md:text-xl'>
								Meu nome é Alexandre Roque, sou engenheiro de Software
								formado pelo CEFET-MG (2024) em Engenharia de computação.
							</p>
						</div>
					</div>
				</div>
			</section>
			<section className='w-full p-6 md:p-12 lg:p-16 bg-muted'>
				<div className='container space-y-12 px-4 md:px-6 flex flex-row gap-2 items-center justify-center'>
					<div className='flex flex-col items-center justify-center space-y-4 text-center'>
						<div className='space-y-2'>
							<div className='inline-block rounded-lg px-3 py-1 text-sm bg-muted-foreground text-muted'>
								Skills &amp; Expertise
							</div>
							<h2 className='text-3xl font-bold tracking-tighter sm:text-5xl'>Experiências</h2>
							<p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
								Trabalho com desenvolvimento de software, majoritariamente focado na linguagem de
								JavaScript e TypeScript, utilizando frameworks como ReactJS, AngularJS e StencilJS.
								Tenho experiência com ElasticSearch, MongoDB, SQLite, Java e Python.
							</p>
						</div>
					</div>

					<Image
						src='/buy-me-a-coffe.jpg'
						alt='Alexandre Roque'
						width={400}
						height={400}
						className='rounded-full self-center w-[250px] sm:w-[400px]'
					/>
				</div>
			</section>
			<section className='w-full p-6 md:p-12 lg:p-16 border-t'>
				<div className='container px-4 md:px-6'>
						<div className='space-y-4'>
							<div className='inline-block rounded-lg bg-muted px-3 py-1 text-sm'>Contatos</div>
							<h2 className='lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]'>
								Fala comigo!
							</h2>
							<p className='text-muted-foreground md:text-xl'>
								Se você quiser saber mais sobre mim e meu trabalho, ou se tiver alguma dúvida ou feedback, não hesite em entrar em contato. Caso queira, você pode comprar um cafézinho para mim.
							</p>
							<div className='flex flex-col gap-2 min-[400px]:flex-row'>
								<Link
									href='mailto:alexandre.roque1313@gmail.com'
									className='inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
								>
									<Mail className='mr-2 h-4 w-4' />
									Email
								</Link>
								<Link
									href='https://www.linkedin.com/in/alexandreroque13/'
									className='inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
								>
									<Icons.linkedin className='mr-2 h-4 w-4' />
									LinkedIn
								</Link>
								<CopyPixButton />
							</div>
						</div>
				</div>
			</section>
		</div>
	);
}
