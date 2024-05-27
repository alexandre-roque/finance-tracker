export const Currencies = [
	{ value: 'BRL', label: 'R$ Real', locale: 'pt-BR' },
	{ value: 'USD', label: '$ Dollar', locale: 'en-US' },
	{ value: 'EUR', label: '€ Euro', locale: 'de-DE' },
	{ value: 'JPY', label: '¥ Yen', locale: 'ja-JP' },
	{ value: 'GBP', label: '£ Pound', locale: 'en-GB' },
];

export type Currency = (typeof Currencies)[0];

export function GetFormatterForCurrency(currency: string) {
	const locale = Currencies.find((c) => c.value === currency)?.locale;

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	});
}
