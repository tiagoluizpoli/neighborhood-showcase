import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import {
  AlertTriangle,
  Eye,
  Loader2,
  Megaphone,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { ProviderDashboardAnnouncementsBuckets } from './-provider-dashboard-state';

type DashboardPeriod = '7d' | '30d' | '12m';

interface ProviderDashboardPerformanceStats {
  totalImpressions: number;
  totalInteractions: number;
  conversionRate: number;
}

interface ChartDataPoint {
  clicks: number;
  impressions: number;
  label: string;
}

interface DashboardAnalyticsState {
  chartData?: ChartDataPoint[];
  isError: boolean;
  isLoading: boolean;
}

interface ProviderDashboardPerformanceOverviewProps {
  announcements: ProviderDashboardAnnouncementsBuckets;
  analytics: DashboardAnalyticsState;
  formatPeriodLabel: (value: string) => string;
  onPeriodChange: (period: DashboardPeriod) => void;
  period: DashboardPeriod;
  stats: ProviderDashboardPerformanceStats;
}

interface KpiCardProps {
  icon: ReactNode;
  iconClass: string;
  label: string;
  children: ReactNode;
}

function KpiCard({ icon, iconClass, label, children }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground text-sm">
          {label}
        </span>
        <div className={`rounded-lg p-2 ${iconClass}`}>{icon}</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const MONTH_ABBR = [
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

type BucketKey = 'active' | 'draft' | 'expired' | 'suspended';

const BUCKET_CONFIG: Array<{ key: BucketKey; i18nKey: string; color: string }> =
  [
    { key: 'active', i18nKey: 'common.active', color: 'bg-emerald-500' },
    { key: 'draft', i18nKey: 'common.draft', color: 'bg-muted-foreground' },
    { key: 'expired', i18nKey: 'common.expired', color: 'bg-amber-500' },
    { key: 'suspended', i18nKey: 'common.suspended', color: 'bg-red-500' },
  ];

function formatDashboardTick(value: string, period: DashboardPeriod): string {
  if (period === '12m') {
    const [year, month] = value.split('-');
    return `${MONTH_ABBR[Number.parseInt(month, 10) - 1]}/${year.slice(2)}`;
  }
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
}

export function ProviderDashboardPerformanceOverview({
  announcements,
  analytics,
  formatPeriodLabel,
  onPeriodChange,
  period,
  stats,
}: ProviderDashboardPerformanceOverviewProps) {
  const { t } = useTranslation();

  const chartData = analytics.chartData?.map((item) => ({
    ...item,
    conversion:
      item.impressions > 0
        ? Number(((item.clicks / item.impressions) * 100).toFixed(2))
        : 0,
  }));

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('dashboard.kpi.impressions_label')}
          icon={<Eye className="h-5 w-5" />}
          iconClass="bg-primary/10 text-primary"
        >
          <h3 className="font-bold text-3xl text-foreground">
            {stats.totalImpressions}
          </h3>
          <p className="mt-1 text-muted-foreground text-xs">
            {t('dashboard.kpi.impressions_desc')}
          </p>
        </KpiCard>

        <KpiCard
          label={t('dashboard.kpi.interactions_label')}
          icon={<MousePointerClick className="h-5 w-5" />}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <h3 className="font-bold text-3xl text-foreground">
            {stats.totalInteractions}
          </h3>
          <p className="mt-1 text-muted-foreground text-xs">
            {t('dashboard.kpi.interactions_desc')}
          </p>
        </KpiCard>

        <KpiCard
          label={t('dashboard.kpi.conversion_label')}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        >
          <h3 className="font-bold text-3xl text-foreground">
            {stats.conversionRate}%
          </h3>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
            />
          </div>
        </KpiCard>

        <KpiCard
          label={t('dashboard.kpi.announcements_label')}
          icon={<Megaphone className="h-5 w-5" />}
          iconClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        >
          <div className="space-y-2">
            {BUCKET_CONFIG.map(({ key, i18nKey, color }) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {t(i18nKey)}
                </span>
                <span className="font-semibold text-foreground">
                  {announcements[key].length}
                </span>
              </div>
            ))}
          </div>
        </KpiCard>
      </div>

      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-foreground text-xl tracking-tight">
              {t('dashboard.chart.title')}
            </h2>
            <p className="text-muted-foreground text-xs">
              {t('dashboard.chart.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '12m'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onPeriodChange(value)}
                className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                  period === value
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {formatPeriodLabel(value)}
              </button>
            ))}
          </div>
        </div>

        {analytics.isLoading ? (
          <div className="flex h-[180px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-xs">
              {t('dashboard.chart.loading')}
            </p>
          </div>
        ) : analytics.isError ? (
          <div className="flex h-[180px] flex-col items-center justify-center space-y-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-xs">
              {t('dashboard.chart.error')}
            </p>
          </div>
        ) : (
          <div className="h-[180px] w-full">
            <ChartContainer
              config={{
                impressions: {
                  label: t('dashboard.kpi.impressions_label'),
                  color: 'var(--chart-1)',
                },
                clicks: {
                  label: t('dashboard.kpi.interactions_label'),
                  color: 'var(--chart-2)',
                },
                conversion: {
                  label: t('dashboard.kpi.conversion_label'),
                  color: 'var(--chart-3)',
                },
              }}
              className="h-full w-full"
            >
              <LineChart data={chartData}>
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
                  tickFormatter={(value) => formatDashboardTick(value, period)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  name={t('dashboard.kpi.impressions_label')}
                  stroke="var(--color-impressions)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name={t('dashboard.kpi.interactions_label')}
                  stroke="var(--color-clicks)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="conversion"
                  name={t('dashboard.kpi.conversion_label')}
                  stroke="var(--color-conversion)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </>
  );
}
