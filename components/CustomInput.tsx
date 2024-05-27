import React from 'react';
import { FormControl, FormField, FormLabel, FormMessage, FormItem, FormDescription } from './ui/form';
import { Input } from './ui/input';

import { Control, FieldPath } from 'react-hook-form';
interface CustomInput {
	control: Control<any>;
	name: FieldPath<any>;
	label: string;
	type?: string;
	placeholder?: string;
	description?: string;
	disabled?: boolean;
}

const CustomInput = ({
	name,
	label,
	control,
	placeholder,
	description,
	type = 'text',
	disabled = false,
}: CustomInput) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className='form-label'>{label}</FormLabel>
					<div className='flex w-full flex-col'>
						<FormControl>
							<Input
								placeholder={placeholder}
								type={type}
								maxLength={name === 'cardNumber' ? 4 : undefined}
								disabled={disabled}
								{...field}
							/>
						</FormControl>
						{description && <FormDescription className='mt-1'>{description}</FormDescription>}
						<FormMessage className='form-message mt-2' />
					</div>
				</FormItem>
			)}
		/>
	);
};

export default CustomInput;
