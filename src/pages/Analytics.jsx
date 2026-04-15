import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getCategoryLabel } from '@/lib/categories';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';

const COLORS = ['hsl(152,58%,38%)', 'hsl(200,65%,50%)', 'hsl(35,85%,55%)', 'hsl(280,55%,55%)', 'hsl(10,75%,55%)', 'hsl(170,50%,45%)', 'hsl(45,80%,50%)', 'hsl(320,60%,50%)', 'hsl(90,50%,45%)', 'hsl(240,50%,55%)'];

export default function Analytics() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Expense breakdown by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ name: getCategoryLabel(category), value: amount }))
    .sort((a, b) => b.value - a.value);

  // Monthly income vs expenses (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return isWithinInterval(d, { start, end });
    });
    monthlyData.push({
      month: format(monthDate, 'MMM'),
      income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }

  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Understand your spending habits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => ['$' + value.toLocaleString('en-US', { minimumFractionDigits: 2 }), 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full max-w-xs">
                    {pieData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                        <span className="text-xs font-medium ml-auto tabular-nums">
                          {((item.value / totalExpenses) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">No expenses yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => '$' + v} />
                  <Tooltip
                    formatter={(value) => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(152,58%,38%)" radius={[6, 6, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="hsl(0,72%,55%)" radius={[6, 6, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Spending Categories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length ? (
              <div className="space-y-3">
                {pieData.slice(0, 5).map((item, i) => {
                  const pct = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No expenses yet</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}