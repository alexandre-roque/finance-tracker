import { useEffect, useState } from 'react';
import { NumberFormatBase } from 'react-number-format';
import { Input } from './input';

export function Numeric({ value, onChange, onBlur, disabled, name }: any) {
	const [str, setStr] = useState('');

	useEffect(() => {
		if (value) {
			setStr(Math.round(value * 100).toString());
		}
	}, [value]);

	return (
		<>
			<NumberFormatBase
				customInput={Input}
				prefix='R$ '
				format={currencyFormatter}
				value={str}
				onValueChange={(values) => {
					setStr(values.value);
					onChange({ target: { value: values.floatValue ? values.floatValue / 100 : 0 } });
				}}
				onBlur={onBlur}
				disabled={disabled}
				name={name}
				isAllowed={(values) => {
					if (values.value.length > 12) return false;
					return true;
				}}
			/>
		</>
	);
}

function currencyFormatter(value: string) {
	if (!Number(value)) return '';

	const amount = new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(Number(value) / 100);

	return `${amount}`;
}
