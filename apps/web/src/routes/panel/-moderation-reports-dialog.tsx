import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@neighborhood-showcase/ui/components/dialog';
import type { ModerationReportedAnnouncement } from './-moderation-reports-types';

interface ModerationReportsDialogProps {
  getReasonLabel: (reasonKey: string) => string;
  selectedAdForReports: ModerationReportedAnnouncement;
  t: (key: string) => string;
  onClose: () => void;
}

export function ModerationReportsDialog({
  getReasonLabel,
  selectedAdForReports,
  t,
  onClose,
}: ModerationReportsDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg border bg-card p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-bold text-foreground text-xl">
            {t('moderation.details_title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {selectedAdForReports.title}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto py-4 pr-1">
          {selectedAdForReports.reports.map((report) => (
            <div
              key={report.id}
              className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  {report.reporterName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground">{report.reporterEmail}</p>
              <div className="pt-1">
                <span className="rounded bg-destructive/10 px-2 py-0.5 font-semibold text-[10px] text-destructive">
                  {getReasonLabel(report.reason)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="h-9 px-4 font-medium text-xs">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
