export function formatProviderDashboardPeriodLabel(value: string) {
  if (value === '7d') return '7 Dias';
  if (value === '30d') return '30 Dias';
  return '12 Meses';
}
