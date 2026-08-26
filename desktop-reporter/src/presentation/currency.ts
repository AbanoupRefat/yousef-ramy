const egpFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEgp(value: number): string {
  return egpFormatter.format(Number.isFinite(value) ? value : 0);
}
