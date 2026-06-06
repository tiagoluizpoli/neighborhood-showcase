import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

interface ProviderDashboardPaymentFlowProps {
  announcementId: string;
}

export function ProviderDashboardPaymentFlow({
  announcementId,
}: ProviderDashboardPaymentFlowProps) {
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [copied, setCopied] = useState<boolean>(false);

  const getPaymentDetailsMutation = useMutation(
    trpc.announcement.getPaymentDetails.mutationOptions(),
  );
  const { mutate: getPaymentDetails } = getPaymentDetailsMutation;

  useEffect(() => {
    getPaymentDetails({ announcementId });
  }, [announcementId, getPaymentDetails]);

  const payment = getPaymentDetailsMutation.data;
  const isGenerating = getPaymentDetailsMutation.isPending;

  const statusQuery = useQuery({
    ...trpc.announcement.getPaymentStatus.queryOptions({ announcementId }),
    refetchInterval: (query) => {
      return query.state.data?.status === 'PENDING' ? 5000 : false;
    },
    enabled: !!payment,
  });

  const currentStatus = statusQuery.data?.status || 'PENDING';

  useEffect(() => {
    if (timeLeft <= 0 || currentStatus === 'PAID') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentStatus]);

  useEffect(() => {
    if (currentStatus === 'PAID') {
      toast.success('Pagamento confirmado! Seu anúncio está ativo.');
      const timeout = setTimeout(() => {
        navigate({ to: '/panel/dashboard' });
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [currentStatus, navigate]);

  const handleCopyCode = async () => {
    if (!payment?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopied(true);
      toast.success(
        'Código Pix Copia e Cola copiado para a área de transferência!',
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Falha ao copiar o código. Por favor, copie manualmente.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isGenerating) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Gerando cobrança Pix de R$ 2,00...
        </p>
      </div>
    );
  }

  if (getPaymentDetailsMutation.isError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="rounded-full border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <CreditCard className="h-10 w-10" />
        </div>
        <h2 className="font-bold text-foreground text-xl">
          Falha ao gerar cobrança
        </h2>
        <p className="max-w-md text-muted-foreground text-sm">
          {getPaymentDetailsMutation.error.message ||
            'Não foi possível estabelecer contato com o gateway de pagamento. Tente novamente mais tarde.'}
        </p>
        <Button
          onClick={() => getPaymentDetailsMutation.mutate({ announcementId })}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  if (currentStatus === 'PAID') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center p-4 md:p-8">
        <div className="relative flex w-full flex-col items-center justify-center space-y-6 rounded-xl border bg-card p-8 text-center text-card-foreground">
          <div className="relative">
            <CheckCircle2 className="relative z-10 h-20 w-20 text-success" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-foreground">
              Pagamento Confirmado!
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Seu anúncio foi publicado com sucesso e estará ativo pelos
              próximos 30 dias.
            </p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-loading-bar bg-success" />
          </div>
          <p className="text-muted-foreground text-xs">
            Redirecionando para o dashboard em instantes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            Pagamento Pix <Timer className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription>
            Pague a taxa única de R$ 2,00 para ativar o seu anúncio por 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="w-full rounded-lg border bg-muted py-4 text-center">
            <span className="block font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Valor a pagar
            </span>
            <span className="mt-1 block font-extrabold text-3xl text-foreground">
              R$ 2,00
            </span>
          </div>

          {payment?.pixQrCode ? (
            <div className="relative rounded-xl border border-border bg-card p-3">
              {timeLeft <= 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background p-4 text-center">
                  <Timer className="mb-2 h-8 w-8 text-destructive" />
                  <p className="font-semibold text-foreground text-xs">
                    QR Code Expirado
                  </p>
                  <Button
                    variant="link"
                    onClick={() =>
                      getPaymentDetailsMutation.mutate({ announcementId })
                    }
                    className="mt-1 text-primary text-xs"
                  >
                    Gerar novo código
                  </Button>
                </div>
              ) : null}
              <img
                src={payment.pixQrCode}
                alt="QR Code Pix"
                className="h-48 w-48 object-contain"
              />
            </div>
          ) : (
            <div className="flex h-48 w-48 animate-pulse items-center justify-center rounded-xl bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Timer className="h-4 w-4 text-primary" />
            <span>Código expira em: </span>
            <span
              className={`font-bold font-mono ${
                timeLeft < 60
                  ? 'animate-pulse text-destructive'
                  : 'text-foreground'
              }`}
            >
              {timeLeft > 0 ? formatTime(timeLeft) : 'Expirado'}
            </span>
          </div>

          {payment?.pixCopyPaste && (
            <div className="w-full space-y-2">
              <Label
                htmlFor="pix-copia-cola"
                className="font-medium text-muted-foreground text-xs"
              >
                Pix Copia e Cola
              </Label>
              <div className="relative flex items-center">
                <input
                  id="pix-copia-cola"
                  type="text"
                  readOnly
                  value={payment.pixCopyPaste}
                  className="w-full overflow-ellipsis rounded-md border bg-background py-2.5 pr-10 pl-3 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-2 text-muted-foreground transition-colors hover:text-foreground"
                  title="Copiar código"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                onClick={handleCopyCode}
                className="mt-2 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {copied ? 'Copiado!' : 'Copiar Código Pix'}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-center text-[10px] text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            <span>Aguardando confirmação do pagamento pelo seu banco...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
