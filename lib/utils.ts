import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function DateToUTCDate(date: Date) {
	return new Date(
		Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds()
		)
	);
}

export type TransactionType = 'income' | 'expense';
export type Timeframe = 'month' | 'year';
export type Period = { year: number; month: number };

function isWeekday(date: Date) {
	const day = date.getDay();
	return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
}

export function getBusinessDayOfMonth(date: Date) {
	const year = date.getFullYear();
	const month = date.getMonth();
	const dayOfMonth = date.getDate();
	let businessDayCount = 0;

	for (let day = 1; day <= dayOfMonth; day++) {
		const currentDate = new Date(year, month, day);
		if (isWeekday(currentDate)) {
			businessDayCount++;
		}
	}

	return businessDayCount;
}
