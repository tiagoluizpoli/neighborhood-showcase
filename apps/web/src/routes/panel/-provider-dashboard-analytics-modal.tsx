import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import { trpc } from '@/utils/trpc';

const analyticsPeriods = ['7d', '30d', '12m'] as const;

type AnalyticsPeriod = (typeof analyticsPeriods)[number];

interface ProviderDashboardAnalyticsModalProps {
  ad: ProviderDashboardAnnouncementItem;
  onClose: () => void;
}

export function ProviderDashboardAnalyticsModal({
  ad,
  onClose,
}: ProviderDashboardAnalyticsModalProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const analyticsQuery = useQuery(
    trpc.announcement.getAnalytics.queryOptions({
      announcementId: ad.id,
      period,
    }),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-3xl rounded-xl border bg-card p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="font-bold text-foreground text-xl">
            Métricas: {ad.title}
          </h3>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Analise a conversão e visualizações do seu anúncio no período
            selecionado.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Visualizações
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.totalImpressions ?? 0}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Interações
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.totalClicks ?? 0}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Conversão
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.conversionRate ?? 0}%
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {analyticsPeriods.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-2.5 py-1 font-medium text-xs transition-all ${
                  period === value
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {value === '7d'
                  ? '7 Dias'
                  : value === '30d'
                    ? '30 Dias'
                    : '12 Meses'}
              </button>
            ))}
          </div>
        </div>

        {analyticsQuery.isLoading ? (
          <div className="flex h-[260px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-xs">
              Carregando métricas...
            </p>
          </div>
        ) : analyticsQuery.isError ? (
          <div className="flex h-[260px] flex-col items-center justify-center space-y-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-xs">
              Erro ao carregar métricas.
            </p>
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ChartContainer
              config={{
                impressions: {
                  label: 'Visualizações',
                  color: 'var(--chart-1)',
                },
                clicks: {
                  label: 'Interações',
                  color: 'var(--chart-2)',
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={analyticsQuery.data?.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (period === '12m') {
                      const [year, month] = value.split('-');
                      const monthNames = [
                        'Jan',
                        'Fev',
                        'Mar',
                        'Abr',
                        'Mai',
                        'Jun',
                        'Jul',
                        'Ago',
                        'Set',
                        'Out',
                        'Nov',
                        'Dez',
                      ];
                      return `${monthNames[Number.parseInt(month, 10) - 1]}/${year.slice(2)}`;
                    }

                    const parts = value.split('-');
                    if (parts.length === 3) {
                      return `${parts[2]}/${parts[1]}`;
                    }

                    return value;
                  }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--muted)' }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="impressions"
                  name="Visualizações"
                  fill="var(--color-impressions)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicks"
                  name="Interações"
                  fill="var(--color-clicks)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}
