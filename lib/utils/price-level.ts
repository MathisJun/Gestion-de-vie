export type PriceLevel = 'ONE_EURO' | 'TWO_EURO' | 'THREE_EURO' | 'FOUR_EURO';

export const priceLevelToSymbol = (level: PriceLevel | null | string): string => {
  if (!level) return '';
  const mapping: Record<string, string> = {
    ONE_EURO: '€',
    TWO_EURO: '€€',
    THREE_EURO: '€€€',
    FOUR_EURO: '€€€€',
  };
  return mapping[level] || '';
};

export const symbolToPriceLevel = (symbol: string): PriceLevel | null => {
  const mapping: Record<string, PriceLevel> = {
    '€': 'ONE_EURO',
    '€€': 'TWO_EURO',
    '€€€': 'THREE_EURO',
    '€€€€': 'FOUR_EURO',
  };
  return mapping[symbol] || null;
};

