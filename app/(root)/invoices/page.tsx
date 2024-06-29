'use client';

import { GetInvoicesResponseType } from '@/app/api/invoices/route';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Lock, LockIcon, LockOpen } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { PayInvoice } from '../_actions/transactions';
import { userSettingsType } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { useMemo } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const Invoices = () => {
	const userSettingsQuery = useQuery<userSettingsType>({
		queryKey: ['user-settings'],
		queryFn: () => fetch('/api/user-settings').then((res) => res.json()),
	});
	const userSettings = userSettingsQuery.data;
	const formatter = useMemo(() => {
		return GetFormatterForCurrency(userSettings?.currency || 'BRL');
	}, [userSettings?.currency]);

	const invoicesQuery = useQuery<GetInvoicesResponseType>({
		queryKey: ['invoices'],
		queryFn: () => fetch('/api/invoices').then((res) => res.json()),
	});

	return (
		<div className='flex flex-col gap-2 p-4'>
			<SkeletonWrapper isLoading={invoicesQuery.isPending}>
				{invoicesQuery.data?.map((invoice) => (
					<Card key={invoice.id} className='flex flex-col gap-2 p-4'>
						<Accordion type='single' collapsible defaultValue={`${invoice.id}-${invoice.name}`}>
							<AccordionItem value={`${invoice.id}-${invoice.name}`}>
								<CardHeader className='pb-2'>
									<AccordionTrigger>
										<CardTitle className='text-lg font-semibold'>Conta: {invoice.name}</CardTitle>
									</AccordionTrigger>
								</CardHeader>
								<AccordionContent className='grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'>
										{invoice.creditCardInvoices.map((creditCardInvoice) => (
											<InvoiceComponent
												key={creditCardInvoice.id}
												creditCardInvoice={creditCardInvoice}
												formatter={formatter}
												invoice={invoice}
											/>
										))}
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</Card>
				))}
			</SkeletonWrapper>
		</div>
	);
};

export default Invoices;

function InvoiceComponent({
	creditCardInvoice,
	invoice,
	formatter,
}: {
	creditCardInvoice: any;
	invoice: any;
	formatter: any;
}) {
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: PayInvoice,
		onSuccess: ({ error }) => {
			if (error) {
				toast.error(`Erro ao pagar fatura: ${error}`, {
					id: 'pay-invoice-error',
				});
				return;
			}

			toast.success('Fatura paga com sucesso', {
				id: 'pay-invoice-success',
			});

			queryClient.invalidateQueries({
				queryKey: ['invoices'],
			});

			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});
		},
		onError: () => {
			toast.error('Erro ao pagar fatura', {
				id: 'pay-invoice-error',
			});
		},
	});

	const closeDate = new Date(creditCardInvoice.year, creditCardInvoice.month + 1, invoice.closeDay);
	const payDate = new Date(creditCardInvoice.year, creditCardInvoice.month + (
		invoice.payDay < invoice.closeDay ? 2 : 1
	), invoice.payDay);

	const isClosed = moment().isAfter(closeDate);
	const isLate = moment().isAfter(payDate);

	return (
		<Card key={creditCardInvoice.id} className='flex flex-col gap-2 p-4'>
			<CardHeader className='pb-2'>
				<CardTitle className='text-lg font-semibold'>
					{moment(new Date(creditCardInvoice.year, creditCardInvoice.month)).format('MM/YYYY')}
				</CardTitle>
				<div className='flex items-center'>
					<span className='text-xl font-bold'>
						{creditCardInvoice.isPaid
							? 'Fatura paga'
							: isLate
							? 'Fatura atrasada'
							: isClosed
							? 'Fatura fechada'
							: 'Fatura aberta'}
					</span>
					{creditCardInvoice.isPaid ? (
						<Check className='ml-2 h-5 w-5' />
					) : isClosed ? (
						<Lock className='ml-2 h-5 w-5' />
					) : (
						<LockOpen className='ml-2 h-5 w-5' />
					)}
				</div>
			</CardHeader>
			<CardContent>
				<p>Valor: {formatter.format(parseFloat(creditCardInvoice.amount ?? '0'))}</p>
				{<p>Fecha em: {moment(closeDate).format('DD/MM/YYYY')}</p>}
				{creditCardInvoice.isPaid && (
					<p>Paga em: {moment(creditCardInvoice.paymentDate).format('DD/MM/YYYY')}</p>
				)}
				{!creditCardInvoice.isPaid && <p>Vencimento: {moment(payDate).format('DD/MM/YYYY')}</p>}
			</CardContent>
			<CardFooter className='flex justify-end'>
				<div className='self-end'>
					<Button
						disabled={isPending || creditCardInvoice.isPaid}
						className='min-w-24'
						variant={isLate ? 'destructive' : undefined}
						onClick={() => {
							toast.loading('Pagando fatura...', {
								id: 'pay-invoice-success',
							});

							mutate({
								invoiceId: creditCardInvoice.id,
							});
						}}
					>
						{isPending ? (
							<>
								Pagando...
								<Loader2 className='animate-spin' />
							</>
						) : isClosed ? (
							'Pagar'
						) : creditCardInvoice.isPaid ? (
							'Paga'
						) : (
							'Adiantar'
						)}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
