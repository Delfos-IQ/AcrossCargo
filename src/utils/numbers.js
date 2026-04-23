/**
 * Formatea un número con separadores de miles y decimales fijos.
 * Usa la locale en-US (coma para miles, punto para decimales).
 */
export const formatNumberWithSeparators = (num, decimalPlaces) => {
  const number = parseFloat(num);
  const value  = isNaN(number) ? 0 : number;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};
