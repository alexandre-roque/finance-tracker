/**
 * v0 by Vercel.
 * @see https://v0.dev/t/E5BMGHWPeyV
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import CopyPixButton from '@/components/common/CopyPixButton';
import Link from 'next/link';

export default function Component() {
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
								Conheça um pouco mais sobre mim, meu nome é Alexandre Roque, sou engenheiro de Software
								formado pelo CEFET-MG (2024) em engenharia de computação.
							</p>
						</div>
					</div>
				</div>
			</section>
			<section className='w-full p-6 md:p-12 lg:p-16 bg-muted'>
				<div className='container space-y-12 px-4 md:px-6 flex flex-col gap-2 items-center justify-center'>
					<div className='flex flex-col items-center justify-center space-y-4 text-center'>
						<div className='space-y-2'>
							<div className='inline-block rounded-lg px-3 py-1 text-sm bg-muted-foreground text-muted'>
								Skills &amp; Expertise
							</div>
							<h2 className='text-3xl font-bold tracking-tighter sm:text-5xl'>Arsenal de conhecimento</h2>
							<p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
								Trabalho com desenvolvimento de software, majoritarimente focado na linguagem de
								JavaScript e TypeScript, utilizando frameworks como ReactJS, AngularJS e StencilJS.
								Experiência com ElasticSearch, MongoDB, SQLite, Java.
							</p>
						</div>
					</div>

					<Image
						src='/buy-me-a-coffe.jpg'
						alt='Alexandre Roque'
						width={400}
						height={400}
						className='rounded-full self-center'
					/>

					<div className='mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12'>
						<div className='grid gap-1'>
							<h3 className='text-xl font-bold'>Software Engineering</h3>
							<p className='text-muted-foreground'>
								John has a deep understanding of software development principles and practices, and has
								hands-on experience building complex, scalable systems.
							</p>
						</div>
						<div className='grid gap-1'>
							<h3 className='text-xl font-bold'>Product Management</h3>
							<p className='text-muted-foreground'>
								With a keen eye for user experience and a focus on delivering value, John has a proven
								track record of successfully managing the development and launch of innovative products.
							</p>
						</div>
						<div className='grid gap-1'>
							<h3 className='text-xl font-bold'>Business Strategy</h3>
							<p className='text-muted-foreground'>
								John entrepreneurial mindset and deep understanding of the tech industry have enabled
								him to develop effective business strategies that drive growth and profitability.
							</p>
						</div>
					</div>
				</div>
			</section>
			<section className='w-full p-6 md:p-12 lg:p-16 border-t'>
				<div className='container px-4 md:px-6'>
					<div className='grid gap-10 px-10 md:gap-16 lg:grid-cols-2'>
						<div className='space-y-4'>
							<div className='inline-block rounded-lg bg-muted px-3 py-1 text-sm'>Contact</div>
							<h2 className='lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]'>
								Get in Touch
							</h2>
							<p className='text-muted-foreground md:text-xl'>
								If youd like to learn more about John and his work, or if you have any questions or
								feedback, please dont hesitate to reach out.
							</p>
							<div className='flex flex-col gap-2 min-[400px]:flex-row'>
								<Link
									href='#'
									className='inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
									prefetch={false}
								>
									Email
								</Link>
								<Link
									href='#'
									className='inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
									prefetch={false}
								>
									LinkedIn
								</Link>
								<CopyPixButton />
							</div>
						</div>
						<div className='flex flex-col items-start space-y-4'>
							<div className='inline-block rounded-lg bg-muted px-3 py-1 text-sm'>
								Awards &amp; Recognition
							</div>
							<p className='mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed'>
								Johns contributions to the tech industry have been widely recognized, with numerous
								awards and accolades that highlight his impact and influence.
							</p>
							<div className='grid grid-cols-2 gap-4'>
								<div className='flex flex-col items-start space-y-1'>
									<div className='text-lg font-bold'>Entrepreneur of the Year</div>
									<div className='text-muted-foreground'>2019</div>
								</div>
								<div className='flex flex-col items-start space-y-1'>
									<div className='text-lg font-bold'>Top 40 Under 40</div>
									<div className='text-muted-foreground'>2021</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
