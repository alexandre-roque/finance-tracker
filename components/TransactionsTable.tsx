'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';
import { GetTransactionHistoryResponseType } from '@/app/api/transactions-history/route';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SkeletonWrapper from '@/components/SkeletonWrapper';
import { DataTableColumnHeader } from '@/components/datatable/ColumnHeader';
import { DateToUTCDate, cn } from '@/lib/utils';
import { DataTableFacetedFilter } from '@/components/datatable/FacetedFilters';
import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from '@/components/datatable/ColumnToggle';

import { download, generateCsv, mkConfig } from 'export-to-csv';
import { DownloadIcon, MoreHorizontal, Pencil, TrashIcon } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteTransactionDialog from './DeleteTransactionsDialog';
import EditTransactionsDialog from './EditTransactionsDialog';
import { useSession } from 'next-auth/react';

interface Props {
	from: Date;
	to: Date;
}

const emptyData: any[] = [];

type TransactionHistoryRow = GetTransactionHistoryResponseType[0];

const columns: ColumnDef<TransactionHistoryRow>[] = [
	{
		accessorKey: 'category',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Categoria' />,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		cell: ({ row }) => (
			<div className='flex gap-2 capitalize'>
				{row.original.categoryIcon}
				<div className='capitalize'>{row.original.category}</div>
			</div>
		),
	},
	{
		accessorKey: 'date',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Data' />,
		cell: ({ row }) => {
			const date = new Date(row.original.date);
			const formattedDate = date.toLocaleDateString('default', {
				timeZone: 'UTC',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			});
			return <div className='text-muted-foreground'>{formattedDate}</div>;
		},
	},
	{
		accessorKey: 'description',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
		cell: ({ row }) => <div>{row.original.description}</div>,
	},
	{
		accessorKey: 'teamId',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Time' />,
		cell: ({ row }) => <div className='capitalize'>{row.original.team?.name}</div>,
		filterFn: (row, id, value) => {
			let flag = value.includes(row.getValue(id));
			if (value.includes('Eu')) {
				flag = flag || !row.getValue(id);
			}
			return flag;
		},
	},
	{
		accessorKey: 'bankingAccountId',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Conta' />,
		cell: ({ row }) => <div className='capitalize'>{row.original.bankingAccount?.name}</div>,
		filterFn: (row, id, value) => {
			let flag = value.includes(row.getValue(id));
			if (value.includes('Nenhuma')) {
				flag = flag || !row.getValue(id);
			}
			return flag;
		},
	},
	{
		accessorKey: 'userId',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Usuário' />,
		cell: ({ row }) => <div className='capitalize'>{row.original.user?.name}</div>,
	},
	{
		accessorKey: 'type',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo' />,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		cell: ({ row }) => (
			<div
				className={cn(
					'capitalize rounded-lg text-center p-2',
					row.original.type === 'income' && 'bg-emerald-400/10 text-emerald-500',
					row.original.type === 'expense' && 'bg-red-400/10 text-red-500'
				)}
			>
				{row.original.type === 'income' ? 'Receita' : 'Despesa'}
			</div>
		),
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Valor' />,
		cell: ({ row }) => (
			<div
				className={cn(
					'capitalize rounded-lg text-center p-2',
					row.original.type === 'income' && 'bg-emerald-400/10 text-emerald-500',
					row.original.type === 'expense' && 'bg-red-400/10 text-red-500'
				)}
			>
				{row.original.formattedAmount}
			</div>
		),
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => <RowActions transaction={row.original} />,
	},
];

const csvConfig = mkConfig({
	fieldSeparator: ',',
	decimalSeparator: '.',
	useKeysAsHeaders: true,
});

function TransactionTable({ from, to }: Props) {
	const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		type: false,
		userId: false,
		teamId: false,
		bankingAccountId: false,
	});

	const history = useQuery<GetTransactionHistoryResponseType>({
		queryKey: ['transactions', 'history', from, to],
		queryFn: () =>
			fetch(`/api/transactions-history?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`).then((res) =>
				res.json()
			),
	});

	const handleExportCSV = (data: any[]) => {
		const csv = generateCsv(csvConfig)(data);
		download(csvConfig)(csv);
	};

	const table = useReactTable({
		data: history.data || emptyData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const categoriesOptions = useMemo(() => {
		const categoriesMap = new Map();
		history.data?.forEach((transaction) => {
			categoriesMap.set(transaction.category, {
				value: transaction.category,
				label: `${transaction.categoryIcon} ${transaction.category}`,
			});
		});
		const uniqueCategories = new Set(categoriesMap.values());
		return Array.from(uniqueCategories);
	}, [history.data]);

	const teamsOptions = useMemo(() => {
		const teamsOptions = new Map();
		history.data?.forEach((transaction) => {
			teamsOptions.set(transaction.teamId ?? 'Eu', {
				value: transaction.teamId ?? 'Eu',
				label: `${transaction.team?.name ?? 'Eu'}`,
			});
		});
		const uniqueTeams = new Set(teamsOptions.values());
		return Array.from(uniqueTeams);
	}, [history.data]);

	const bankingAccountsOptions = useMemo(() => {
		const bankingAccountsOptions = new Map();
		history.data?.forEach((transaction) => {
			bankingAccountsOptions.set(transaction.bankingAccountId ?? 'Nenhuma', {
				value: transaction.bankingAccountId ?? 'Nenhuma',
				label: `${transaction.bankingAccount?.name ?? 'Nenhuma'}`,
			});
		});
		const uniquebankingAccounts = new Set(bankingAccountsOptions.values());
		return Array.from(uniquebankingAccounts);
	}, [history.data]);

	return (
		<div className='w-full'>
			<div className='flex flex-wrap items-end justify-between gap-2 py-4'>
				<div className='flex gap-2'>
					{table.getColumn('category') && (
						<DataTableFacetedFilter
							title='Categoria'
							column={table.getColumn('category')}
							options={categoriesOptions}
						/>
					)}
					{table.getColumn('type') && (
						<DataTableFacetedFilter
							title='Tipo'
							column={table.getColumn('type')}
							options={[
								{ label: 'Receita', value: 'income' },
								{ label: 'Despesa', value: 'expense' },
							]}
						/>
					)}
					{table.getColumn('teamId') && (
						<DataTableFacetedFilter
							title='Time'
							column={table.getColumn('teamId')}
							options={teamsOptions}
						/>
					)}
					{table.getColumn('bankingAccountId') && (
						<DataTableFacetedFilter
							title='Conta'
							column={table.getColumn('bankingAccountId')}
							options={bankingAccountsOptions}
						/>
					)}
				</div>
				<div className='flex flex-wrap gap-2'>
					<Button
						variant={'outline'}
						size={'sm'}
						className='ml-auto h-8 lg:flex'
						onClick={() => {
							const data = table.getFilteredRowModel().rows.map((row) => ({
								Categoria: `${row.original.categoryIcon} ${row.original.category}`,
								Data: row.original.date,
								Descrição: row.original.description,
								Time: row.original.team?.name ?? 'Eu',
								Conta: row.original.bankingAccount?.name ?? 'Nenhuma',
								Usuário: row.original.user?.name,
								Tipo: row.original.type === 'income' ? 'Receita' : 'Despesa',
								Valor: row.original.formattedAmount,
							}));
							handleExportCSV(data);
						}}
					>
						<DownloadIcon className='mr-2 h-4 w-4' />
						Exportar para CSV
					</Button>
					<DataTableViewOptions table={table} />
				</div>
			</div>
			<SkeletonWrapper isLoading={history.isFetching}>
				<div className='rounded-md border'>
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className='h-24 text-center'>
										Sem resultados
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className='flex items-center justify-end space-x-2 py-4'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Anterior
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Próximo
					</Button>
				</div>
			</SkeletonWrapper>
		</div>
	);
}

export default TransactionTable;

function RowActions({ transaction }: { transaction: TransactionHistoryRow }) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const session = useSession();

	return (
		<>
			<DeleteTransactionDialog
				open={showDeleteDialog}
				setOpen={setShowDeleteDialog}
				transactionId={transaction.id}
				installmentId={transaction.installmentId}
			/>
			<EditTransactionsDialog open={showEditDialog} setOpen={setShowEditDialog} transaction={transaction} />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant={'ghost'} className='h-8 w-8 p-0 '>
						<span className='sr-only'>Open menu</span>
						<MoreHorizontal className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuLabel>Ações</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{transaction.userId === session.data?.user?.id && (
						<DropdownMenuItem
							className='flex items-center gap-2'
							onSelect={() => {
								setShowEditDialog((prev) => !prev);
							}}
						>
							<Pencil className='h-4 w-4 text-muted-foreground' />
							Editar
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						className='flex items-center gap-2'
						onSelect={() => {
							setShowDeleteDialog((prev) => !prev);
						}}
					>
						<TrashIcon className='h-4 w-4 text-muted-foreground' />
						Deletar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
