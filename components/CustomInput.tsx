import React from 'react';
import { FormControl, FormField, FormLabel, FormMessage, FormItem } from './ui/form';
import { Input } from './ui/input';

import { Control, FieldPath } from 'react-hook-form';
interface CustomInput {
	control: Control<any>;
	name: FieldPath<any>;
	label: string;
	placeholder: string;
}

const CustomInput = ({ control, name, label, placeholder }: CustomInput) => {
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
								type={name === 'password' ? 'password' : 'text'}
								maxLength={name === 'cardNumber' ? 4 : undefined}
								{...field}
							/>
						</FormControl>
						<FormMessage className='form-message mt-2' />
					</div>
				</FormItem>
			)}
		/>
	);
};

export default CustomInput;
