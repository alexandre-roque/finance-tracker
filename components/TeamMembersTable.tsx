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
import { Loader2, MoreHorizontal, Pencil, PlusSquare, TrashIcon } from 'lucide-react';
import { DataTableColumnHeader } from './datatable/ColumnHeader';
import { ResponsiveDialog } from './ui/responsive-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DeleteTeamMember } from '@/app/(root)/_actions/teams';
import EditTeamMemberForm from './EditTeamMemberForm';
import { useSession } from 'next-auth/react';

type teamMembersType = {
	teamId: string;
	id: string;
	userId: string;
	role: string;
	status: string;
	percentage: number;
	user: {
		name: string;
	};
};

export const ROLE_MAP = {
	owner: 'Proprietário',
	member: 'Membro',
	manager: 'Gerente',
};

export const STATUS_MAP = {
	active: 'Ativo',
	inactive: 'Inativo',
	pending: 'Pendente',
	blocked: 'Bloqueado',
};

const columns: ColumnDef<teamMembersType>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
		cell: ({ row }) => {
			return (
				<div className='flex items-center space-x-2'>
					<div>{row.original.user.name}</div>
				</div>
			);
		},
	},
	{
		accessorKey: 'percentage',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Porcentagem %' />,
		cell: ({ row }) => {
			return (
				<div className='flex items-center space-x-2'>
					<div>{row.original.percentage}</div>
				</div>
			);
		},
	},
	{
		accessorKey: 'role',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Cargo' />,
		cell: ({ row }) => (
			<div className='max-w-80 truncate'>{ROLE_MAP[row.getValue('role') as keyof typeof ROLE_MAP]}</div>
		),
	},
	{
		accessorKey: 'status',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => (
			<div className='max-w-80 truncate'>{STATUS_MAP[row.getValue('status') as keyof typeof STATUS_MAP]}</div>
		),
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];

function TeamMembersTable({ data }: { data: teamMembersType[] }) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data: data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
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
		<div className='w-full'>
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
		</div>
	);
}

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
}

function DataTableRowActions({ row }: DataTableRowActionsProps<teamMembersType>) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const queryClient = useQueryClient();

	const teamMemberId = row.original.id;

	const session = useSession();

	const deleteMutation = useMutation({
		mutationFn: DeleteTeamMember,
		onSuccess: async ({ error }) => {
			if (error) {
				toast.error(error, {
					id: teamMemberId,
				});
				return;
			}

			toast.success('Membro deletado com sucesso', {
				id: teamMemberId,
			});

			await queryClient.invalidateQueries({
				queryKey: ['teams-with-members'],
			});
		},
		onError: () => {
			toast.error('Algo deu errado', {
				id: teamMemberId,
			});
		},
	});

	return (
		<>
			<ResponsiveDialog isOpen={isEditOpen} setIsOpen={setIsEditOpen} title='Editar membro de time'>
				<EditTeamMemberForm setIsOpen={setIsEditOpen} teamMember={row.original} />
			</ResponsiveDialog>
			<ResponsiveDialog
				isOpen={isDeleteOpen}
				setIsOpen={setIsDeleteOpen}
				title='Deletar membro de time'
				description={`Você tem certeza que quer retirar o membro ${row.original.user.name}?`}
			>
				<div className='mt-auto flex flex-col gap-2 p-4 pt-2'>
					<Button
						variant='destructive'
						onClick={() => {
							toast.loading('Deletando membro de time...', {
								id: teamMemberId,
							});
							deleteMutation.mutate({
								teamMemberId,
							});
						}}
					>
						{deleteMutation.isPending ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Deletando...
							</>
						) : (
							'Deletar'
						)}
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
							if (session.data?.user?.id === row.original.userId) {
								toast.error('Você não pode se apagar', {
									id: 'edit-team-member',
								});
								return;
							}
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

export default TeamMembersTable;
