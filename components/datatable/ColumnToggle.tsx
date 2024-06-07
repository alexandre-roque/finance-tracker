'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
	const COLUMN_MAP = {
		category: 'Categoria',
		date: 'Data',
		description: 'Descrição',
		teamId: 'Time',
		userId: 'Usuário',
		type: 'Tipo',
		amount: 'Valor',
		bankingAccountId: 'Conta',
		dayOfTheMonth: 'Dia do mês',
		businessDay: 'Dia útil',
	};
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='sm' className='ml-auto h-8 flex'>
					<MixerHorizontalIcon className='mr-2 h-4 w-4' />
					Colunas
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-[150px]'>
				<DropdownMenuLabel>Visualizar</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
					.map((column) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className='capitalize'
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{COLUMN_MAP[column.id as keyof typeof COLUMN_MAP]}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
