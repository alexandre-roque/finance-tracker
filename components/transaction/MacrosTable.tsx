'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';
import { RankingInfo, rankItem } from '@tanstack/match-sorter-utils';

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SkeletonWrapper from '@/components/common/SkeletonWrapper';
import { DataTableColumnHeader } from '@/components/datatable/ColumnHeader';
import { DataTableFacetedFilter } from '@/components/datatable/FacetedFilters';
import { Button } from '@/components/ui/button';

import { MoreHorizontal, Pencil, TrashIcon } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DebouncedInput from '../ui/debounced-input';
import { PAYMENT_TYPES_MAP } from './CreateTransactionDialog';
import { possiblePaymentTypesArray } from '@/schemas';
import { cn } from '@/lib/utils';
import { GetMacrosResponseType } from '@/app/api/macros/route';
import { DataTableViewOptions } from '../datatable/ColumnToggle';
import DeleteMacroDialog from './DeleteMacroDialog';
import CreateOrEditMacroDialog from './CreateOrEditMacroDialog';

const emptyData: any[] = [];

type MacroRow = GetMacrosResponseType[0];

declare module '@tanstack/react-table' {
	//add fuzzy filter to the filterFns
	interface FilterFns {
		fuzzy?: FilterFn<unknown>;
	}
	interface FilterMeta {
		itemRank: RankingInfo;
	}
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
	// Rank the item
	const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	addMeta({
		itemRank,
	});

	// Return if the item should be filtered in/out
	return itemRank.passed;
};

const formatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	minimumFractionDigits: 2,
	currency: 'BRL',
});

const columns: ColumnDef<MacroRow>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
		cell: ({ row }) => <div>{row.original.name}</div>,
	},
	{
		accessorKey: 'categoryId',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Categoria' />,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		cell: ({ row }) => (
			<div className='flex gap-2 capitalize'>
				{row.original.category?.icon}
				<div className='capitalize'>{row.original.category?.name}</div>
			</div>
		),
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Data de criação' />,
		cell: ({ row }) => {
			if (!row.original.createdAt) return <div className='text-muted-foreground'>Sem data</div>;
			const date = new Date(row.original.createdAt);
			const formattedDate = date.toLocaleDateString('default', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: 'numeric',
				minute: 'numeric',
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
		accessorKey: 'paymentType',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Forma de pagamento' />,
		cell: ({ row }) => (
			<div className='capitalize'>{row.original.paymentType === 'credit' ? 'Crédito' : 'Débito'}</div>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
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
				{row.original.amount ? formatter.format(row.original.amount) : 'Sem valor'}
			</div>
		),
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => <RowActions macro={row.original} />,
	},
];

function MacroTable() {
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		type: true,
		name: true,
		teamId: true,
		createdAt: false,
		paymentType: true,
		bankingAccountId: true,
	});

	const macro = useQuery<GetMacrosResponseType>({
		queryKey: ['macros'],
		queryFn: () => fetch(`/api/macros`).then((res) => res.json()),
	});

	const table = useReactTable({
		data: macro.data || emptyData,
		columns,
		filterFns: {
			fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
		},
		getCoreRowModel: getCoreRowModel(),
		initialState: {
			pagination: {
				pageSize: 50,
			},
		},
		state: {
			sorting,
			globalFilter,
			columnFilters,
			columnVisibility,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: 'fuzzy',
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const categoriesOptions = useMemo(() => {
		const categoriesMap = new Map();
		macro.data?.forEach((macro) => {
			categoriesMap.set(macro.categoryId, {
				value: macro.categoryId,
				label: `${macro.category?.icon} ${macro.category?.name}`,
			});
		});
		const uniqueCategories = new Set(categoriesMap.values());
		return Array.from(uniqueCategories);
	}, [macro.data]);

	const teamsOptions = useMemo(() => {
		const teamsOptions = new Map();
		macro.data?.forEach((macro) => {
			teamsOptions.set(macro.teamId ?? 'Eu', {
				value: macro.teamId ?? 'Eu',
				label: `${macro.team?.name ?? 'Eu'}`,
			});
		});
		const uniqueTeams = new Set(teamsOptions.values());
		return Array.from(uniqueTeams);
	}, [macro.data]);

	const bankingAccountsOptions = useMemo(() => {
		const bankingAccountsOptions = new Map();
		macro.data?.forEach((macro) => {
			bankingAccountsOptions.set(macro.bankingAccountId ?? 'Nenhuma', {
				value: macro.bankingAccountId ?? 'Nenhuma',
				label: `${macro.bankingAccount?.name ?? 'Nenhuma'}`,
			});
		});
		const uniquebankingAccounts = new Set(bankingAccountsOptions.values());
		return Array.from(uniquebankingAccounts);
	}, [macro.data]);

	return (
		<div className='w-full'>
			<CreateOrEditMacroDialog open={showCreateDialog} setOpen={setShowCreateDialog} />
			<div className='flex flex-wrap items-end justify-between gap-2 py-4 sm:'>
				<Button
					onClick={() => {
						setShowCreateDialog((prev) => !prev);
					}}
				>
					Criar macro
				</Button>
				<DebouncedInput
					value={globalFilter ?? ''}
					onChange={(value) => setGlobalFilter(String(value))}
					className='p-2 font-lg shadow border border-block'
					placeholder='Pesquisar por macros...'
					debounce={300}
				/>
				<div className='lg:flex gap-2 sm:grid sm:grid-cols-4'>
					{table.getColumn('categoryId') && (
						<DataTableFacetedFilter
							title='Categoria'
							column={table.getColumn('categoryId')}
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
					{table.getColumn('paymentType') && (
						<DataTableFacetedFilter
							title='Tipo de pagamento'
							column={table.getColumn('paymentType')}
							options={possiblePaymentTypesArray.map((value) => ({
								value,
								label: PAYMENT_TYPES_MAP[value],
							}))}
						/>
					)}
				</div>
				<div className='flex flex-wrap gap-2'>
					<DataTableViewOptions table={table} />
				</div>
			</div>
			<SkeletonWrapper isLoading={macro.isFetching}>
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
						<TableFooter>
							{table.getFooterGroups().map((footer) => (
								<TableRow key={footer.id}>
									{footer.headers.map((header) => (
										<TableHead key={header.id}>
											{flexRender(header.column.columnDef.footer, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableFooter>
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

export default MacroTable;

function RowActions({ macro }: { macro: MacroRow }) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	return (
		<>
			<DeleteMacroDialog open={showDeleteDialog} setOpen={setShowDeleteDialog} macroId={macro.id} />
			<CreateOrEditMacroDialog open={showEditDialog} setOpen={setShowEditDialog} macro={macro} />
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
					<DropdownMenuItem
						className='flex items-center gap-2'
						onSelect={() => {
							setShowEditDialog((prev) => !prev);
						}}
					>
						<Pencil className='h-4 w-4 text-muted-foreground' />
						Editar
					</DropdownMenuItem>
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
