/**
 * Money utilities:
 * All monetary amounts are stored as integers representing centavos (1 PHP = 100 centavos)
 * to avoid floating-point rounding errors.
 */

export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function formatPHP(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

