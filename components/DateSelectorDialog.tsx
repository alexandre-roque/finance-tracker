'use client';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { ptBR } from 'date-fns/locale';
import { Control } from 'react-hook-form';
import { useState } from 'react';

const DateSelectorDialog = ({
	dateValue,
	control,
	showLabel = true,
	onChange,
}: {
	dateValue: Date;
	control: Control<any>;
	showLabel?: boolean;
	onChange?: (value: Date) => void;
}) => {
	const [open, setOpen] = useState(false);

	return (
		<FormField
			control={control}
			name='date'
			render={({ field }) => (
				<FormItem>
					{showLabel && <FormLabel className='form-label'>Data da transação</FormLabel>}
					<div className='flex w-full flex-col'>
						<FormControl>
							<Dialog open={open} onOpenChange={setOpen}>
								<DialogTrigger asChild>
									<FormControl>
										<Button
											variant={'outline'}
											className={cn(
												'w-[200px] pl-3 text-left font-normal',
												!dateValue && 'text-muted-foreground'
											)}
										>
											{dateValue ? (
												format(dateValue, 'PPP', { locale: ptBR })
											) : (
												<span>Selecione uma data</span>
											)}
											<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
										</Button>
									</FormControl>
								</DialogTrigger>
								<DialogContent className='w-auto p-4'>
									<DialogHeader>
										<DialogTitle>Data da transação</DialogTitle>
									</DialogHeader>
									<Calendar
										locale={ptBR}
										mode='single'
										selected={dateValue}
										onSelect={(value) => {
											if (!value) return;
											field.onChange(value);
											onChange && onChange(value);
											setOpen(false);
										}}
										initialFocus
									/>
								</DialogContent>
							</Dialog>
						</FormControl>
						<FormMessage className='form-message mt-2' />
					</div>
				</FormItem>
			)}
		/>
	);
};

export default DateSelectorDialog;
