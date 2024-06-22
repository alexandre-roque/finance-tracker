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

export function isWeekday(date: Date) {
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
	// Função para criar um hash a partir da string
	function hashCode(s: string) {
		return s.split('').reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
	}

	const hash = hashCode(str);

	// Fixar o matiz em 0 (vermelho)
	const h = 15 + (hash % 10);

	// Calcular a saturação (s) e a luminosidade (l) a partir do hash
	// Garantir que os valores estejam dentro dos limites aceitáveis
	const s = 50 + (hash % 50); // Saturação entre 50% e 100%
	const l = 40 + (hash % 20); // Luminosidade entre 40% e 60%

	return `hsl(${h}, ${s}%, ${l}%)`;
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

export async function computeSHA256(file: File) {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
