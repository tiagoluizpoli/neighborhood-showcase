import { Badge } from '@neighborhood-showcase/ui/components/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { trpc } from '@/utils/trpc';

const analyticsPeriods = ['7d', '30d', '12m'] as const;

type AnalyticsPeriod = (typeof analyticsPeriods)[number];

interface ProviderDashboardAnalyticsPanelProps {
  announcementId: string;
  period: AnalyticsPeriod;
  title: string;
  onPeriodChange: (period: AnalyticsPeriod) => void;
}

export function ProviderDashboardAnalyticsPanel({
  announcementId,
  onPeriodChange,
  period,
  title,
}: ProviderDashboardAnalyticsPanelProps) {
  const { t } = useTranslation();
  const analyticsQuery = useQuery(
    trpc.announcement.getAnalytics.queryOptions({
      announcementId,
      period,
    }),
  );

  return (
    <section className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-foreground text-xl">
              {t('meus_anuncios.detail.analytics.title')}
            </h2>
            <Badge variant="secondary">{title}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('meus_anuncios.detail.analytics.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {analyticsPeriods.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodChange(value)}
              className={`rounded-full px-3 py-1.5 font-medium text-sm transition-all ${
                period === value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t(`meus_anuncios.detail.analytics.periods.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={t('meus_anuncios.detail.analytics.metrics.impressions')}
          value={analyticsQuery.data?.summary.totalImpressions ?? 0}
        />
        <MetricCard
          label={t('meus_anuncios.detail.analytics.metrics.interactions')}
          value={analyticsQuery.data?.summary.totalClicks ?? 0}
        />
        <MetricCard
          label={t('meus_anuncios.detail.analytics.metrics.conversion')}
          value={`${analyticsQuery.data?.summary.conversionRate ?? 0}%`}
        />
      </div>

      {analyticsQuery.isLoading ? (
        <div className="flex h-[210px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {t('meus_anuncios.detail.analytics.loading')}
          </p>
        </div>
      ) : analyticsQuery.isError ? (
        <div className="flex h-[210px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-destructive/5 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground text-sm">
            {t('meus_anuncios.detail.analytics.error')}
          </p>
        </div>
      ) : (
        <div className="h-[210px] w-full">
          <ChartContainer
            config={{
              impressions: {
                color: 'var(--chart-1)',
                label: t('meus_anuncios.detail.analytics.metrics.impressions'),
              },
              clicks: {
                color: 'var(--chart-2)',
                label: t('meus_anuncios.detail.analytics.metrics.interactions'),
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
                tickFormatter={(value) => formatAnalyticsTick(value, period)}
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
                name={t('meus_anuncios.detail.analytics.metrics.impressions')}
                fill="var(--color-impressions)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="clicks"
                name={t('meus_anuncios.detail.analytics.metrics.interactions')}
                fill="var(--color-clicks)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-background px-4 py-3">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 font-semibold text-2xl text-foreground">{value}</p>
    </div>
  );
}

function formatAnalyticsTick(value: string, period: AnalyticsPeriod) {
  if (period === '12m') {
    const [year, month] = value.split('-');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[Number.parseInt(month, 10) - 1]}/${year.slice(2)}`;
  }

  const parts = value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }

  return value;
}
