'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Row,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, Pencil, PlusSquare, TrashIcon } from 'lucide-react';
import { DataTableColumnHeader } from './datatable/ColumnHeader';
import { bankingAccountsType } from '@/db/schema/finance';
import { ResponsiveDialog } from './ui/responsive-dialog';
import EditBankingAccountForm from './EditBankingAccountForm';
import CreateBankingAccountDialog from './CreateBankingAccountDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteBankingAccount } from '@/app/(root)/_actions/bankingAccounts';
import { toast } from 'sonner';

const columns: ColumnDef<bankingAccountsType>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
		cell: ({ row }) => {
			const name = row.original.name as string;

			return (
				<div className='flex items-center space-x-2'>
					<div>{name}</div>
				</div>
			);
		},
	},
	{
		accessorKey: 'description',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
		cell: ({ row }) => <div className='max-w-80 truncate'>{row.getValue('description')}</div>,
	},
	{
		accessorKey: 'payDay',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Dia de pagamento' />,
		cell: ({ row }) => <div className='max-w-80 truncate'>{row.getValue('payDay')}</div>,
	},
	{
		accessorKey: 'closeDay',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Dia de fechamento' />,
		cell: ({ row }) => <div className='max-w-80 truncate'>{row.getValue('closeDay')}</div>,
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];

function BankingAccountsTable({ data }: { data: bankingAccountsType[] }) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data: data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		filterFns: { fuzzy: () => true },
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			rowSelection,
		},
	});

	return (
		<div className='w-full mt-3'>
			<div className='flex justify-between'>
				<span className='text-lg font-semibold'>Gerenciar contas bancárias</span>
				<CreateBankingAccountDialog
					trigger={
						<Button className='gap-2 text-sm'>
							<PlusSquare className='h-4 w-4' />
							Criar conta
						</Button>
					}
				/>
			</div>
			<div className='rounded-md border mt-2'>
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
		</div>
	);
}

interface WithId<T> {
	id: string;
}
interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
}

function DataTableRowActions<TData extends WithId<string>>({ row }: DataTableRowActionsProps<TData>) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const queryClient = useQueryClient();
	const bankingAccountId = row.original.id as string;

	const deleteMutation = useMutation({
		mutationFn: DeleteBankingAccount,
		onSuccess: async () => {
			toast.success('Conta deletada com sucesso', {
				id: bankingAccountId,
			});

			await queryClient.invalidateQueries({
				queryKey: ['banking-accounts'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: bankingAccountId,
			});
		},
	});

	return (
		<>
			<ResponsiveDialog isOpen={isEditOpen} setIsOpen={setIsEditOpen} title='Editar conta bancária'>
				<EditBankingAccountForm
					bankingAccount={row.original as unknown as bankingAccountsType}
					setIsOpen={setIsEditOpen}
				/>
			</ResponsiveDialog>
			<ResponsiveDialog
				isOpen={isDeleteOpen}
				setIsOpen={setIsDeleteOpen}
				title='Deletar conta bancária'
				description='Você tem certeza que quer deletar a conta bancária?'
			>
				<div className='mt-auto flex flex-col gap-2 p-4 pt-2'>
					<Button
						variant='destructive'
						onClick={() => {
							toast.loading('Deletando conta bancária...', {
								id: bankingAccountId,
							});
							deleteMutation.mutate({
								bankingAccountId,
							});
						}}
					>
						Deletar
					</Button>
				</div>
			</ResponsiveDialog>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' className='h-8 w-8 p-0 place-self-end'>
						<span className='sr-only'>Open menu</span>
						<MoreHorizontal className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px] z-50'>
					<DropdownMenuLabel>Ações</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className='flex items-center gap-2'
						onSelect={() => {
							setIsEditOpen((prev) => !prev);
						}}
					>
						<Pencil className='h-4 w-4 text-muted-foreground' />
						Editar
					</DropdownMenuItem>
					<DropdownMenuItem
						className='flex items-center gap-2'
						onSelect={() => {
							setIsDeleteOpen((prev) => !prev);
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

export default BankingAccountsTable;
