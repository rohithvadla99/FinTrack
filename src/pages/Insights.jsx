import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Repeat, TrendingDown, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategoryLabel } from '@/lib/categories';
import { buildHeatmap, simulateWhatIf, detectSubscriptionLeaks, detectRecurring } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const HEATMAP_COLORS = ['bg-muted', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80', 'bg-primary'];

function intensityClass(v) {
  if (v === 0) return HEATMAP_COLORS[0];
  if (v < 0.2) return HEATMAP_COLORS[1];
  if (v < 0.4) return HEATMAP_COLORS[2];
  if (v < 0.6) return HEATMAP_COLORS[3];
  if (v < 0.8) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

const SIMULATABLE_CATS = ['food', 'entertainment', 'shopping', 'transport', 'subscriptions', 'travel'];

export default function Insights() {
  const [adjustments, setAdjustments] = useState({});

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const heatmap = useMemo(() => buildHeatmap(transactions), [transactions]);
  const simulation = useMemo(() => simulateWhatIf(transactions, adjustments), [transactions, adjustments]);
  const subscriptionLeaks = useMemo(() => detectSubscriptionLeaks(transactions), [transactions]);

  const expenseCats = useMemo(() => {
    const bycat = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      bycat[t.category] = (bycat[t.category] || 0) + t.amount;
    });
    return bycat;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Smart tools to optimize your finances</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* What-If Simulator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" /> What-If Simulator
              </CardTitle>
              <p className="text-xs text-muted-foreground">Adjust spending to see projected savings</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {SIMULATABLE_CATS.filter(c => expenseCats[c] > 0).map(cat => {
                const pct = adjustments[cat] ?? 0;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{getCategoryLabel(cat)}</span>
                      <span className={cn(
                        'font-semibold tabular-nums text-xs',
                        pct < 0 ? 'text-primary' : pct > 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {pct === 0 ? 'No change' : `${pct > 0 ? '+' : ''}${pct}%`}
                      </span>
                    </div>
                    <Slider
                      min={-80}
                      max={50}
                      step={5}
                      value={[pct]}
                      onValueChange={([v]) => setAdjustments(prev => ({ ...prev, [cat]: v }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>-80%</span><span>0</span><span>+50%</span>
                    </div>
                  </div>
                );
              })}

              {/* Result */}
              <div className="mt-4 p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Baseline (30d)</span>
                  <span className="font-semibold">${simulation.baseline.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Simulated (30d)</span>
                  <span className="font-semibold">${simulation.simulated.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-bold">
                  <span>Monthly savings</span>
                  <span className={simulation.totalSavings >= 0 ? 'text-primary' : 'text-destructive'}>
                    {simulation.totalSavings >= 0 ? '+' : ''} ${simulation.totalSavings.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  That's <span className="font-semibold text-foreground">${simulation.annualSavings.toFixed(0)}</span> per year
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" /> Spending Heatmap
              </CardTitle>
              <p className="text-xs text-muted-foreground">Which days you spend the most</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 justify-center mt-4">
                {heatmap.map((d, i) => (
                  <motion.div
                    key={d.day}
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
                    style={{ transformOrigin: 'bottom' }}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                      ${d.total > 0 ? (d.total >= 1000 ? (d.total / 1000).toFixed(1) + 'k' : d.total.toFixed(0)) : '0'}
                    </span>
                    <div
                      className={cn('w-10 rounded-t-lg transition-all', intensityClass(d.intensity))}
                      style={{ height: `${Math.max(16, d.intensity * 140)}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-6 justify-center">
                <span className="text-xs text-muted-foreground">Low</span>
                {HEATMAP_COLORS.map((c, i) => (
                  <div key={i} className={cn('w-5 h-3 rounded', c)} />
                ))}
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              {heatmap.length > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Highest spending: <span className="font-semibold text-foreground">
                    {heatmap.sort((a, b) => b.total - a.total)[0]?.day}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Leak Detector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" /> Subscription Leaks
              </CardTitle>
              <p className="text-xs text-muted-foreground">Recurring charges you might not need</p>
            </CardHeader>
            <CardContent>
              {subscriptionLeaks.length ? (
                <div className="space-y-3">
                  {subscriptionLeaks.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{sub.description || getCategoryLabel(sub.category)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{sub.period}</Badge>
                          <span className="text-xs text-muted-foreground capitalize">{getCategoryLabel(sub.category)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">-${sub.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">~${(sub.amount * 12).toFixed(0)}/yr</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Total annual cost: <span className="font-semibold text-foreground">
                      ${subscriptionLeaks.reduce((s, r) => s + r.amount * 12, 0).toFixed(0)}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Repeat className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No subscription leaks detected</p>
                  <p className="text-xs mt-1">Add more transactions to get insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recurring Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" /> Recurring Expenses
              </CardTitle>
              <p className="text-xs text-muted-foreground">All detected recurring charges</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const rec = detectRecurring(transactions);
                if (!rec.length) return (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">No recurring patterns detected yet</p>
                    <p className="text-xs mt-1">Needs at least 2 similar transactions</p>
                  </div>
                );
                return (
                  <div className="space-y-2">
                    {rec.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getCategoryLabel(r.category)}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">{r.period}</Badge>
                        </div>
                        <span className="font-semibold text-destructive tabular-nums">-${r.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between text-sm font-semibold">
                      <span>Monthly total</span>
                      <span className="text-destructive">
                        -${rec.reduce((s, r) => s + (r.period === 'weekly' ? r.amount * 4.3 : r.period === 'bi-weekly' ? r.amount * 2.15 : r.amount), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}