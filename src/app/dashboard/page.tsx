import { Suspense } from 'react';
import DashboardClient from './dashboard-client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/4" />
        </div>
        
        <Card>
            <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: string; name?: string };
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient role={searchParams.role} name={searchParams.name} />
    </Suspense>
  );
}
