import {
  Card,
  CardContent,
  CardHeader,
} from '@neighborhood-showcase/ui/components/card';
import { Skeleton } from '@neighborhood-showcase/ui/components/skeleton';

export function AnnouncementCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border bg-card">
      {/* Image section */}
      <div className="relative aspect-4/3 w-full bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <CardHeader className="flex-grow p-4 pb-2">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>

        {/* Subtitle */}
        <Skeleton className="mt-1.5 h-4 w-1/2" />

        {/* Description */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Category & Location */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>

      {/* Footer / Identity and Action */}
      <CardContent className="mt-auto p-4 pt-0">
        <hr className="mb-3 border-border/50" />

        <div className="flex items-center justify-between gap-2">
          {/* Provider Identity */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Contact Action */}
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
