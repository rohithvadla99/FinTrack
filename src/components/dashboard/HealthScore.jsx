import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

function scoreColor(score) {
  if (score >= 75) return 'text-primary';
  if (score >= 45) return 'text-yellow-500';
  return 'text-destructive';
}

function scoreLabel(score) {
  if (score >= 75) return 'Great';
  if (score >= 45) return 'Fair';
  return 'Needs Work';
}

export default function HealthScore({ score, breakdown }) {
  const pct = Math.min(100, Math.max(0, score ?? 0));

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-primary" /> Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score ring */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                className="text-muted" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                className={scoreColor(pct)}
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round" />
            </svg>
            <span className={cn('absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums', scoreColor(pct))}>
              {pct}
            </span>
          </div>
          <div>
            <p className={cn('text-xl font-bold', scoreColor(pct))}>{scoreLabel(pct)}</p>
            <p className="text-xs text-muted-foreground">out of 100 points</p>
          </div>
        </div>

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</p>
            <div className="space-y-2">
              {breakdown.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.value}/{item.max} pts · {item.detail}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', scoreColor(Math.round((item.value / item.max) * 100)))}
                      style={{ width: `${Math.round((item.value / item.max) * 100)}%` }}
                    />
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