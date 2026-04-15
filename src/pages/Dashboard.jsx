import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog';
import HealthScore from '@/components/dashboard/HealthScore';
import AutopilotCard from '@/components/dashboard/AutopilotCard';
import AnomalyAlerts from '@/components/dashboard/AnomalyAlerts';
import PersonalizationTip from '@/components/dashboard/PersonalizationTip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  computeHealthScore,
  detectRecurring,
  projectBalance,
  detectAnomalies,
  generateInsights,
  getPersonalizationProfile,
} from '@/lib/analytics';

export default function Dashboard() {
  const [showAdd, setShowAdd] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const { score, breakdown } = useMemo(() => computeHealthScore(transactions), [transactions]);
  const recurring = useMemo(() => detectRecurring(transactions), [transactions]);
  const projection = useMemo(() => projectBalance(transactions, recurring), [transactions, recurring]);
  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);
  const profile = useMemo(() => getPersonalizationProfile(transactions), [transactions]);

  const fmt = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your financial overview</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Balance" value={fmt(balance)} icon={Wallet} />
        <StatCard title="Income" value={fmt(totalIncome)} icon={TrendingUp} />
        <StatCard title="Expenses" value={fmt(totalExpenses)} icon={TrendingDown} />
      </div>

      {/* Personalization tip */}
      <PersonalizationTip profile={profile} />

      {/* Alerts & Anomalies */}
      {(anomalies.length > 0 || insights.length > 0) && (
        <AnomalyAlerts anomalies={anomalies} insights={insights} />
      )}

      {/* Health + Autopilot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthScore score={score} breakdown={breakdown} />
        <AutopilotCard projection={projection} recurring={recurring} />
      </div>

      {/* Recent Transactions */}
      <Card className="rounded-2xl border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <Link to="/transactions" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentTransactions transactions={transactions} />
        </CardContent>
      </Card>

      <AddTransactionDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}