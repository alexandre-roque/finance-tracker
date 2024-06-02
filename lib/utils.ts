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

export function hashStringToHSL(str: string) {
	// Cria um hash simples usando a função de hash de string
	function hashCode(str: string) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	// Converte o hash em valores HSL
	function intToHSL(hash: number) {
		let hue = 30 + (hash % 10); // Matiz entre 30° e 40°
		let saturation = (hash % 100) + 50; // Saturação entre 50% e 149%
		let lightness = ((hash >> 8) % 40) + 30; // Luminosidade entre 30% e 69%
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}

	return intToHSL(hashCode(str));
}

export function orangeHSLToGreenHSL(hsl: string) {
	// Converte uma string HSL para componentes numéricos
	function hslStringToComponents(hsl: string) {
		let components = hsl.match(/\d+/g)!.map(Number);
		return components; // [h, s, l]
	}

	// Converte componentes numéricos HSL para uma string HSL
	function componentsToHSLString(h: number, s: number, l: number) {
		return `hsl(${h}, ${s}%, ${l}%)`;
	}

	// Extrai os componentes HSL
	let [h, s, l] = hslStringToComponents(hsl);

	// Ajusta o matiz de 0 (vermelho) para 120 (verde)
	h = 170;

	// Converte os componentes ajustados de volta para uma string HSL
	return componentsToHSLString(h, s, l);
}
