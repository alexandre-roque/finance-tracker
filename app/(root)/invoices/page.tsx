'use client';

import { GetInvoicesResponseType } from '@/app/api/invoices/route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Cog, Loader2, Lock, LockOpen, Trash2 } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { EditInvoice, PayInvoice } from '../_actions/invoices';
import { bankingAccountsType, creditCardInvoicesType, userSettingsType } from '@/db/schema/finance';
import { GetFormatterForCurrency } from '@/lib/currencies';
import { useMemo, useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import DeleteInvoiceDialog from '@/components/transaction/DeleteInvoiceDialog';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
			{invoicesQuery.isLoading && (
				<div className='flex mt-20 w-full items-center justify-center'>
					<div className='flex flex-col items-center space-y-4'>
						<div className='animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 h-12 w-12' />
					</div>
				</div>
			)}
			<Accordion type='multiple' defaultValue={['0']}>
				{invoicesQuery.data?.map((invoice, index) => (
					<Card key={invoice.id} className='flex flex-col gap-2 p-4'>
						<AccordionItem disabled={!invoice.creditCardInvoices.length} value={index.toString()}>
							<CardHeader className='pb-2'>
								<AccordionTrigger
									disabled={!invoice.creditCardInvoices.length}
									className={cn(
										!invoice.creditCardInvoices.length &&
											'hover:no-underline hover:cursor-not-allowed'
									)}
								>
									<CardTitle
										className={cn(
											'text-lg font-semibold',
											!invoice.creditCardInvoices.length && 'text-muted-foreground'
										)}
									>
										Conta: {invoice.name}
									</CardTitle>
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
					</Card>
				))}
			</Accordion>
		</div>
	);
};

export default Invoices;

function InvoiceComponent({
	creditCardInvoice,
	invoice,
	formatter,
}: {
	creditCardInvoice: creditCardInvoicesType;
	invoice: bankingAccountsType;
	formatter: Intl.NumberFormat;
}) {
	const queryClient = useQueryClient();

	const payInvoiceMutation = useMutation({
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
	const payDate = new Date(
		creditCardInvoice.year,
		creditCardInvoice.month + (invoice.payDay < invoice.closeDay ? 2 : 1),
		invoice.payDay
	);

	const isClosed = moment().isAfter(closeDate);
	const isLate = moment().isAfter(payDate);

	return (
		<Card key={creditCardInvoice.id} className='flex flex-col gap-2 p-4 max-w-80'>
			<CardHeader className='pb-2'>
				<CardTitle className='text-lg font-semibold flex items-center gap-2 justify-between'>
					{moment(new Date(creditCardInvoice.year, creditCardInvoice.month)).format('MM/YYYY')}
					<div className='flex gap-2'>
						<EditInvoiceDialog
							invoice={creditCardInvoice}
							trigger={
								<Button variant='secondary' className='size-8' size='icon'>
									<Cog />
								</Button>
							}
						/>
						<DeleteInvoiceDialog
							invoice={creditCardInvoice}
							trigger={
								<Button variant='destructive' className='size-8' size='icon'>
									<Trash2 />
								</Button>
							}
						/>
					</div>
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
				<p>Valor: {formatter.format(creditCardInvoice.amount)}</p>
				{<p>Fecha em: {moment(closeDate).format('DD/MM/YYYY')}</p>}
				{creditCardInvoice.isPaid && (
					<p>Paga em: {moment(creditCardInvoice.paymentDate).format('DD/MM/YYYY')}</p>
				)}
				{!creditCardInvoice.isPaid && <p>Vencimento: {moment(payDate).format('DD/MM/YYYY')}</p>}
			</CardContent>
			<CardFooter className='flex justify-end'>
				<div className='self-end'>
					<Button
						disabled={payInvoiceMutation.isPending || Boolean(creditCardInvoice.isPaid)}
						className='min-w-24'
						variant={isLate ? 'destructive' : undefined}
						onClick={() => {
							toast.loading('Pagando fatura...', {
								id: 'pay-invoice-success',
							});

							payInvoiceMutation.mutate({
								invoiceId: creditCardInvoice.id,
							});
						}}
					>
						{payInvoiceMutation.isPending ? (
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

function EditInvoiceDialog({ invoice, trigger }: { invoice: creditCardInvoicesType; trigger: React.ReactNode }) {
	const [amount, setAmount] = useState<number>(invoice.amount);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: EditInvoice,
		onSuccess: ({ error }) => {
			if (error) {
				toast.error(`Erro ao editar fatura: ${error}`, {
					id: 'edit-invoice-error',
				});
				return;
			}

			toast.success('Fatura editada com sucesso', {
				id: 'edit-invoice-success',
			});

			queryClient.invalidateQueries({
				queryKey: ['invoices'],
			});

			queryClient.invalidateQueries({
				queryKey: ['overview'],
			});

			setOpen(false);
		},
		onError: () => {
			toast.error('Erro ao editar fatura', {
				id: 'edit-invoice-error',
			});
		},
	});

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Editar fatura</DialogTitle>
				</DialogHeader>
				<Input
					value={amount}
					type='number'
					onChange={(ev) => {
						setAmount(parseFloat(ev.target.value));
					}}
				/>
				<DialogFooter>
					<DialogClose asChild>
						<Button
							type='button'
							variant={'ghost'}
							onClick={() => {
								setAmount(invoice.amount);
							}}
						>
							Cancelar
						</Button>
					</DialogClose>
					<Button
						onClick={() => {
							mutate({ invoiceId: invoice.id, amount: amount });
						}}
						disabled={isPending}
					>
						{!isPending && 'Editar'}
						{isPending && <Loader2 className='animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
