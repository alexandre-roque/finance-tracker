import React from 'react';
import { FormControl, FormField, FormLabel, FormMessage, FormItem, FormDescription } from '../ui/form';
import { Input } from '../ui/input';

import { Control, FieldPath } from 'react-hook-form';
import { PasswordInput } from '../ui/password-input';
interface CustomInput {
	control: Control<any>;
	name: FieldPath<any>;
	label: string;
	type?: string;
	placeholder?: string;
	description?: string;
	disabled?: boolean;
	fullWidth?: boolean;
	min?: number;
	max?: number;
	step?: string;
	isPassword?: boolean;
	isCurrency?: boolean;
}

const CustomInput = ({
	min,
	max,
	name,
	step,
	label,
	control,
	fullWidth,
	placeholder,
	description,
	type = 'text',
	disabled = false,
	isPassword = false,
}: CustomInput) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={fullWidth ? 'w-full' : ''}>
					<FormLabel className='form-label'>{label}</FormLabel>
					<div className='flex w-full flex-col'>
						<FormControl>
							{isPassword ? (
								<PasswordInput
									placeholder={placeholder}
									disabled={disabled}
									autoComplete='current-password'
									{...field}
								/>
							) : (
								<Input
									placeholder={placeholder}
									type={type}
									disabled={disabled}
									step={name === 'amount' ? '0.1' : step}
									min={min}
									max={max}
									{...field}
								/>
							)}
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
