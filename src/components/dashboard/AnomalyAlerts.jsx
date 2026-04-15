import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryLabel } from '@/lib/categories';
import { cn } from '@/lib/utils';

export default function AnomalyAlerts({ anomalies, insights }) {
  const all = [
    ...anomalies.map(a => ({
      type: 'anomaly',
      severity: a.severity,
      message: `You spent ${a.multiplier}× more than usual on ${getCategoryLabel(a.category)} this week ($${a.current.toFixed(0)} vs avg $${a.average.toFixed(0)})`,
    })),
    ...insights.filter(i => i.type === 'increase').map(i => ({
      type: 'insight',
      severity: 'medium',
      message: i.message,
    })),
    ...insights.filter(i => i.type === 'decrease').map(i => ({
      type: 'positive',
      severity: 'low',
      message: i.message,
    })),
  ];

  if (!all.length) return null;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" /> Alerts & Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {all.slice(0, 5).map((item, i) => (
          <div key={i} className={cn(
            'flex items-start gap-3 p-3 rounded-xl text-sm',
            item.type === 'positive' ? 'bg-primary/10' : item.severity === 'high' ? 'bg-destructive/10' : 'bg-yellow-500/10'
          )}>
            {item.type === 'positive'
              ? <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              : <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', item.severity === 'high' ? 'text-destructive' : 'text-yellow-400')} />
            }
            <p className="text-muted-foreground leading-snug">{item.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}