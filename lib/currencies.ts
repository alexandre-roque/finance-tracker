export const Currencies = [
	{ value: 'BRL', label: 'R$ Real', locale: 'pt-BR' },
	{ value: 'USD', label: '$ Dollar', locale: 'en-US' },
	{ value: 'EUR', label: '€ Euro', locale: 'de-DE' },
	{ value: 'JPY', label: '¥ Yen', locale: 'ja-JP' },
	{ value: 'GBP', label: '£ Pound', locale: 'en-GB' },
];

export type Currency = (typeof Currencies)[0];

export function GetFormatterForCurrency(currency:string, isHidden = false): Intl.NumberFormat {
	const locale = Currencies.find((c) => c.value === currency)?.locale;

	// Se isHidden for true, retorna uma função que sempre retorna um valor oculto
	if (isHidden) {
		return {
			format: () => '*****',
			resolvedOptions: () => new Intl.NumberFormat(locale).resolvedOptions(),
			formatToParts: () => [],
			formatRange: () => '',
			formatRangeToParts: () => []
		};
	}

	// Caso contrário, retorna o formatador de moeda padrão
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		minimumFractionDigits: 2,
		currency,
	});
}