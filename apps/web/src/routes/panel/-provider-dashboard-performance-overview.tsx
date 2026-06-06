import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import {
  AlertTriangle,
  Eye,
  Loader2,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface ProviderDashboardPerformanceStats {
  totalImpressions: number;
  totalInteractions: number;
  conversionRate: number;
}

interface ProviderDashboardPerformanceOverviewProps {
  analytics: {
    chartData?: Array<{
      clicks: number;
      impressions: number;
      label: string;
    }>;
    isError: boolean;
    isLoading: boolean;
  };
  formatPeriodLabel: (value: string) => string;
  onPeriodChange: (period: '7d' | '30d' | '12m') => void;
  period: '7d' | '30d' | '12m';
  stats: ProviderDashboardPerformanceStats;
}

export function ProviderDashboardPerformanceOverview({
  analytics,
  formatPeriodLabel,
  onPeriodChange,
  period,
  stats,
}: ProviderDashboardPerformanceOverviewProps) {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Visualizações
            </span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-foreground">
              {stats.totalImpressions}
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Exibições na vitrine pública
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Interações
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-foreground">
              {stats.totalInteractions}
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Cliques em WhatsApp/Instagram/Site
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Taxa de Conversão
            </span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="font-bold text-3xl text-foreground">
                {stats.conversionRate}%
              </h3>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-foreground text-xl tracking-tight">
              Desempenho Geral
            </h2>
            <p className="text-muted-foreground text-xs">
              Histórico de visualizações e interações no período selecionado.
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {formatPeriodLabel(value)}
              </button>
            ))}
          </div>
        </div>

        {analytics.isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-xs">
              Carregando dados de desempenho...
            </p>
          </div>
        ) : analytics.isError ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-xs">
              Erro ao carregar dados de desempenho.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
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
              <BarChart data={analytics.chartData}>
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
    </>
  );
}
