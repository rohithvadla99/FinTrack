import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';

export default function AutopilotCard({ projection, recurring }) {
  const isPositive = projection.projected >= projection.current;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Financial Autopilot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Projected Balance */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground">Projected balance in 30 days</p>
            <p className={cn('text-xl font-bold tabular-nums', isPositive ? 'text-primary' : 'text-destructive')}>
              ${Math.abs(projection.projected).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={cn('p-2.5 rounded-xl', isPositive ? 'bg-primary/10' : 'bg-destructive/10')}>
            {isPositive ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
          </div>
        </div>

        {/* Upcoming Bills */}
        {recurring.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Bills</p>
            <div className="space-y-1.5">
              {recurring.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[140px]">{getCategoryLabel(r.category)}</span>
                    <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded-full">
                      {r.period}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-destructive">-${r.amount.toLocaleString()}</span>
                    <p className="text-[10px] text-muted-foreground">~{format(r.nextDate, 'MMM d')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}